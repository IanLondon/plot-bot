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

function getCartesian(bot, someStepDelta, cartesianType) {
    // Returns cartesian coordinates (relative to top left pulley) from a given stepDelta.
    // cartesianType == 'abs' means absolute coordinates (measured from left pulley)
    // 'rel' means relative coordinates (measured from top left of drawing area)

    //XXX: clone the array, it's not necessary - but just to be safe
    someStepDelta = someStepDelta.slice();

    //string lengths
    var s_l = someStepDelta[0]*bot.STEP_LEN;
    var s_r = someStepDelta[1]*bot.STEP_LEN + bot.DIST_BTW_PULLEYS;

    if (s_l < 0 || s_r < 0) {
        throw new InvalidDimensionsError("String length cannot be negative");
    }

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

function getBipolar(bot, x, y, cartesianType) {
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

    var steps_l = Math.sqrt(Math.pow(x,2) + Math.pow(y,2)) / bot.STEP_LEN;
    var steps_r = (Math.sqrt(Math.pow(bot.DIST_BTW_PULLEYS - x,2) + Math.pow(y,2)) - bot.DIST_BTW_PULLEYS) / bot.STEP_LEN;

    return [Math.round(steps_l), Math.round(steps_r)];
}

// Conversion factor, since I measured in inches
var MM_PER_IN = 25.4;

Plotbot = {
    // All measurements are in these units
    UNITS: 'mm',

    MAX_RPM: 30, // fastest speed in rotations per minute. Too fast = stepper slippage

    // The distance between the centers of the left and right pulleys
    DIST_BTW_PULLEYS: 106.25*MM_PER_IN,

    STEP_LEN: 30.25/1000*MM_PER_IN, //Measured 1000 steps

    // the displacement between the robot origin (center of top left pulley)
    // and drawing area origin (top left corner)
    DISPLACE_WIDTH: 22.5*MM_PER_IN, // 6.75" to top left of whiteboard
    DISPLACE_HEIGHT: 26.5*MM_PER_IN, //21" to top left of whiteboard

    // dimensions of drawing area rectangle.
    DRAWING_AREA_WIDTH: 48*MM_PER_IN, //96" whiteboard
    DRAWING_AREA_HEIGHT: 26*MM_PER_IN, //48" whiteboard

    sanityCheck: function() {
        return sanityCheck(this);
    },
    getCartesian: function(someStepDelta, cartesianType) {
        return getCartesian(this, someStepDelta, cartesianType);
    },
    getBipolar: function(x, y, cartesianType) {
        return getBipolar(this, x, y, cartesianType);
    },
    validateStepDelta: function(stepDelta) {
        return validateStepDelta(this, stepDelta);
    },

    stepDelta: [0,0], // will get changed immediately
};

// Set initial stepDelta to drawing area origin.
// Don't do (0,0) or you can wind up outside of the rectangle
// due to rounding!
Plotbot.stepDelta = Plotbot.getBipolar(10, 10, "rel");

// initial sanity check on fresh configuration
Plotbot.sanityCheck();

module.exports = Plotbot;
