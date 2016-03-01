// plotbot.js handles the setup details of the plotting robot, including
// dimensions and conversion between bipolar and Cartesian coordinates.

function InvalidDimensionsError(message) {
    Error.captureStackTrace(this);
    this.name = 'InvalidDimensionsError';
    this.message = (message || '');
}
InvalidDimensionsError.prototype = Object.create(Error.prototype);

function validateStepDelta(bot, stepDelta) {
    // Sanity check on the given stepDelta.
    var currentRelCartesian = bot.getCartesian(stepDelta, 'rel');

    if (currentRelCartesian.x < 0 ||
        currentRelCartesian.y < 0 ||
        currentRelCartesian.x > bot.DRAWING_AREA_WIDTH ||
        currentRelCartesian.y > bot.DRAWING_AREA_HEIGHT
    ) {
        console.log("Relative Cartesian position out of bounds");
        console.log(currentRelCartesian);
        return false;
    }
    if (currentRelCartesian.s_l < 0 || currentRelCartesian.s_r < 0) {
        console.log("String length cannot be negative");
        console.log(currentRelCartesian);
        return false;
    }

    // all clear
    return true;
}

function sanityCheck(bot) {
    // Sanity check for bot dimensional constants, & the current position
    if (bot.DIST_BTW_PULLEYS < (bot.DRAWING_AREA_WIDTH + bot.DISPLACE_WIDTH)) {
        throw new InvalidDimensionsError('Drawing area width + horizontal displacement cannot exceed dist btw pulleys');
    }
    if (bot.DIST_BTW_PULLEYS <= 0 ||
        bot.DRAWING_AREA_WIDTH <= 0 ||
        bot.DRAWING_AREA_HEIGHT <= 0
    ) {
        throw new InvalidDimensionsError('Value must be > 0');
    }
    if (bot.DISPLACE_WIDTH < 0 || bot.DISPLACE_HEIGHT < 0) {
        throw new InvalidDimensionsError("Displacement cannot be negative");
    }

    // Check current cursor position
    if (!bot.validateStepDelta(bot.stepDelta)) {
        throw new InvalidDimensionsError("Current cursor position is invalid");
    }

    // all clear
    return true;
}

function assertPositiveLengths(s_l, s_r){
    // Make sure string lengths are positive
    if (s_l < 0 || s_r < 0) {
        throw new InvalidDimensionsError("String length cannot be negative");
    }
    return true;
}

function getCartesian(bot, stepDelta, cartesianType) {
    // Returns cartesian coordinates (relative to top left pulley) from a given stepDelta.
    // cartesianType == 'abs' means absolute coordinates (measured from left pulley)
    // 'rel' means relative coordinates (measured from top left of drawing area)

    //XXX: clone the array, it's not necessary - but just to be safe
    someStepDelta = stepDelta.slice();

    //string lengths
    var s_l = someStepDelta[0]*bot.STEP_LEN_L;
    var s_r = someStepDelta[1]*bot.STEP_LEN_R + bot.DIST_BTW_PULLEYS;

    assertPositiveLengths(s_l, s_r);

    //cartesian coords
    var x = (Math.pow(s_l, 2) - Math.pow(s_r, 2) + Math.pow(bot.DIST_BTW_PULLEYS, 2) ) / (2 * bot.DIST_BTW_PULLEYS);
    var y = Math.sqrt( Math.abs( Math.pow(s_l, 2) - Math.pow(x,2) ));

    if (cartesianType == 'rel') {
        x -= bot.DISPLACE_WIDTH;
        y -= bot.DISPLACE_HEIGHT;
    } else if (cartesianType != 'abs') {
        throw new Error("cartesianType must be 'rel' or 'abs'");
    }

    return {x: x, y: y, s_l: s_l, s_r: s_r};
}

function getBipolarFromStrLen(bot, s_l, s_r) {
    // given string lengths s_l and s_r, return bipolar coords

    assertPositiveLengths(s_l, s_r);

    var leftDelta = s_l / bot.STEP_LEN_L;
    var rightDelta = (s_r - bot.DIST_BTW_PULLEYS) / bot.STEP_LEN_R;

    return [Math.round(leftDelta), Math.round(rightDelta)];
}

function getBipolarFromCart(bot, x, y, cartesianType) {
    // (x, y) are Cartesian coordinates.
    // cartesianType == 'abs' means absolute coordinates (measured from left pulley)
    // 'rel' means relative coordinates (measured from top left of drawing area)

    if (cartesianType == 'rel') {
        // if it's relative, add in the displacement vector to make it absolute
        x += bot.DISPLACE_WIDTH;
        y += bot.DISPLACE_HEIGHT;
    } else if (cartesianType != 'abs') {
        throw new Error("cartesianType must be 'rel' or 'abs'");
    }

    // Calculate string lengths w/ Pythagorean
    var s_l = Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
    var s_r = (Math.sqrt(Math.pow(bot.DIST_BTW_PULLEYS - x,2) + Math.pow(y,2)));

    var stepDelta = getBipolarFromStrLen(bot, s_l, s_r);

    return stepDelta;
}

function reZero(bot) {
    // DEBUG. TODO: remove this function once done
    // set relative cartesian (0,0) to current position
    // this is the top left of the drawing area.
    var rel_cartesian = bot.getCartesian(bot.stepDelta, 'rel');
    bot.DISPLACE_WIDTH += rel_cartesian.x;
    bot.DISPLACE_HEIGHT += rel_cartesian.y;
}

function initialize(bot) {
    // Set initial stepDelta to drawing area origin.
    bot.stepDelta = bot.getBipolarFromStrLen(bot.START_STR_LEN_L, bot.START_STR_LEN_R, "abs");
    var abs_cartesian = bot.getCartesian(bot.stepDelta, 'abs');

    // Use the initial string length parameters to calculate the DISPLACE_WIDTH & HEIGHT
    // (It's easier to measure the intital string lengths w/ a tape measure
    // than to try and measure the horiz and vert displacement!)
    bot.DISPLACE_WIDTH = abs_cartesian.x;
    bot.DISPLACE_HEIGHT = abs_cartesian.y;
}

// Conversion factor, since I measured in inches
var MM_PER_IN = 25.4;

Plotbot = {
    // All measurements are in these units
    UNITS: 'mm',

    MAX_RPM: 60, // fastest speed in rotations per minute. Too fast = stepper slippage

    // TODO: enforce this on server side, it's not client's decision!
    // DELAY_BTW_COMMANDS: 100, // rest a moment between commands for steadier movement

    // The distance between the centers of the left and right pulleys
    DIST_BTW_PULLEYS: 106.25*MM_PER_IN,

    STEP_LEN_L: ((107.375-34.875)*MM_PER_IN)/(4309-1732), //(94-53)*MM_PER_IN/2000, // 2000 steps, measured from pulley to gondola attachmt point
    STEP_LEN_R: ((85.75-46.25)*MM_PER_IN)/((-918)-(-2087)), //(106.5-65.5)*MM_PER_IN/2000, // 2000 steps, measured from pulley to gondola attachmt point
    //Old R: 0.849 from diff btw corners
    // STEP_LEN for Left and Right steppers can be significantly different
    // even when you have the same motors & spools! (Didn't happen this time :D )

    // the displacement between the robot origin (center of top left pulley)
    // and drawing area origin (top left corner)
    DISPLACE_WIDTH: 0,
    DISPLACE_HEIGHT: 0, // gets set later using START_STR_LEN_L & R

    // put the 'ideal'/'theoretical' string length, not necessarily
    // the pulley-to-gondola-attachment-point string length.
    START_STR_LEN_L: 895.35,
    START_STR_LEN_R: 2222.5,

    // dimensions of drawing area rectangle.
    DRAWING_AREA_WIDTH: 48*MM_PER_IN, //96" whiteboard
    DRAWING_AREA_HEIGHT: 26*MM_PER_IN, //48" whiteboard

    sanityCheck: function() {
        return sanityCheck(this);
    },
    getCartesian: function(someStepDelta, cartesianType) {
        return getCartesian(this, someStepDelta, cartesianType);
    },
    getBipolarFromCart: function(x, y, cartesianType) {
        return getBipolarFromCart(this, x, y, cartesianType);
    },
    getBipolarFromStrLen: function(s_l, s_r) {
        return getBipolarFromStrLen(this, s_l, s_r);
    },
    validateStepDelta: function(stepDelta) {
        return validateStepDelta(this, stepDelta);
    },
    reZero: function() {
        return reZero(this);
    },
    initialize: function() {
        return initialize(this);
    },

    stepDelta: [0,0], // will get changed immediately
};

console.log("Starting position:" + Plotbot.stepDelta);

//initialize stepDelta and displacement
Plotbot.initialize();

// initial sanity check on fresh configuration
Plotbot.sanityCheck();

module.exports = Plotbot;
