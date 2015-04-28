var canvas = document.getElementById("canvas1");
var context = canvas.getContext("2d");
var imageData = context.createImageData(canvas.width, canvas.height);

var Convert = {
  //TODO separate this into module? acts like Math.
  ft_mm : function(ft) {
    //1 ft = 304.8 mm
    return ft * 304.8; }
};

function setIntervalX(callback, delay, repetitions, finished) {
  // Helper function to call a given no of timers.
  // delay is in milliseconds.

  var i = 0;
  var intervalId = window.setInterval( function () {

    callback();
    i += 1;

    if (i === repetitions) {
      window.clearInterval(intervalId);
      if (typeof(finished) !== 'undefined') { finished(); }
    }
  }, delay);
}

var WallRobot = function(opts) {
  //all working units are in MM! MM is "native".

  // stepDelta tracks steps from the origin position.
  // Negative values retract the string, positive values extend the string
  // stepDelta[0] is left stepper, and stepDelta[1] is right stepper.
  this.stepDelta = [0, 0];

  // horizontal distance from motors to side of board in mm
  this.MOTOR_SIDE_OFFSET = opts.MOTOR_SIDE_OFFSET;

  // height of motors above top of drawing area in mm
  this.MOTOR_HEIGHT = opts.MOTOR_HEIGHT;

  this.DRAW_AREA_WIDTH = opts.DRAW_AREA_WIDTH;
  this.DRAW_AREA_HEIGHT = opts.DRAW_AREA_HEIGHT;

  this.STRING_LEN_PER_STEP = opts.STRING_LEN_PER_STEP;

  // TODO
  this.DEFAULT_SPEED = opts.DEFAULT_SPEED;

  this.vectorLen = function(x, y) {
    return Math.sqrt( Math.pow(x,2) + Math.pow(y,2) );
  };

  // Derivative values:
  this.INITIAL_STR_LEN_LEFT = this.vectorLen(this.MOTOR_SIDE_OFFSET, this.MOTOR_HEIGHT);
  this.INITIAL_STR_LEN_RIGHT = this.vectorLen(this.MOTOR_SIDE_OFFSET + this.DRAW_AREA_WIDTH, this.MOTOR_HEIGHT);

  this.MOTOR_TO_MOTOR_DIST = this.DRAW_AREA_WIDTH + 2*this.MOTOR_SIDE_OFFSET;

  this.initSanityCheck = function () {
    // Make sure all the constants are sane and consistent.

    //allow for rounding errors and general JS floating point errors
    var TOLERANCE_AMT = 0.00000000001;

    //constant scalars that should be > 0
    _.forEach([
      "MOTOR_SIDE_OFFSET",
      "MOTOR_HEIGHT",
      "DRAW_AREA_WIDTH",
      "DRAW_AREA_HEIGHT",
      "INITIAL_STR_LEN_LEFT",
      "INITIAL_STR_LEN_RIGHT",
      "MOTOR_TO_MOTOR_DIST",
      "DEFAULT_SPEED"
      ],
      function(param) {

      if (this[param] <= 0) {
        throw new Error(
          param + " must be > 0."
        );
      }
    }, this);

  };

  // Call for sanity check upon initialization
  this.initSanityCheck();
};

    //r_p is the only vector that should always have a <= 0 x component
  //   if(this.r_p.x > 0) {
  //     throw new Error("r_p should not have an x component > 0");
  //   }
  //
  //   if(this.L_R.y !== 0) {
  //     throw new Error("L_R should not have a horizontal component.");
  //   }
  //
  //   if(this.l_p.y !== this.r_p.y) {
  //     throw new Error("l_p and r_p should have the same y value.");
  //   }
  //
  //   if(Math.abs(this.l_p.length() - this.string_len_left) > TOLERANCE_AMT) {
  //     throw new Error("l_p's length should ~equal string_len_left.");
  //   }
  //
  //   if(Math.abs(this.r_p.length() - this.string_len_right) > TOLERANCE_AMT) {
  //   throw new Error("r_p's length should ~equal string_len_right.");
  //   }
  //


// Getters (and setters, if you make any)
Object.defineProperties(WallRobot.prototype, {

  string_len_left : {
    get: function() {
      return this.stepDelta[0]*this.STRING_LEN_PER_STEP + this.INITIAL_STR_LEN_LEFT;
    }
  },

  string_len_right : {
    get: function() {
      return this.stepDelta[1]*this.STRING_LEN_PER_STEP + this.INITIAL_STR_LEN_RIGHT;
    }
  },

  x : {
    get: function() {
      return (( Math.pow(this.string_len_left,2) - Math.pow(this.string_len_right,2) +
        Math.pow(this.MOTOR_TO_MOTOR_DIST,2) ) / (2 * this.MOTOR_TO_MOTOR_DIST) - this.MOTOR_SIDE_OFFSET);
    }
  },

  y : {
    get: function() {
      //TODO: this can probably be more efficient (not calling x.get()...)
      return (Math.sqrt(Math.pow(this.string_len_left, 2) - Math.pow(this.x + this.MOTOR_SIDE_OFFSET, 2)) - this.MOTOR_HEIGHT);
    }
  },

});

// Rest of methods

WallRobot.prototype.checkPosition = function(x, y) {
  // You can pass x and y values if you want to test them without changing
  // the stepDelta. If you don't specify, this.x and this.y are used,
  // which are calculated using this.stepDelta
  if (typeof(x)==='undefined') x = this.x;
  if (typeof(y)==='undefined') y = this.y;

  if (x < 0) { throw new Error("x should not be negative"); }
  if (y < 0) { throw new Error("y should not be negative"); }
  if (x > this.DRAW_AREA_WIDTH) { throw new Error("x should not be greater than DRAW_AREA_WIDTH"); }
  if (y > this.DRAW_AREA_HEIGHT) { throw new Error("y should not be greater than DRAW_AREA_HEIGHT"); }

  return true;
};

WallRobot.prototype.setStepDelta = function(left, right) {
  // TODO: Check if the resulting x,y is valid as well!
  this.nextStepDelta = [Math.round(left), Math.round(right)];

  console.log(this.nextStepDelta);
};

WallRobot.prototype.setDeltaByCoords = function(x, y) {
  // dx and dy are the components of the vector from the left stepper shaft
  // to the gondola's xy position.
  var dx = x + this.MOTOR_SIDE_OFFSET;
  var dy = y + this.MOTOR_HEIGHT;

  var new_left_len = this.vectorLen(dx, dy);
  var new_right_len = this.vectorLen(this.MOTOR_TO_MOTOR_DIST - dx, dy);

  this.setDeltaByLengths(new_left_len, new_right_len);
};

WallRobot.prototype.setDeltaByLengths = function(left_len, right_len) {
  // Use given string lengths to set a new delta
  this.setStepDelta( (left_len - this.INITIAL_STR_LEN_LEFT) / this.STRING_LEN_PER_STEP,
    (right_len - this.INITIAL_STR_LEN_RIGHT) / this.STRING_LEN_PER_STEP);
};

WallRobot.prototype.drawToBoard = function () {
  // instead of calling setPixel directly, this is kind of a hook.
  // later I will implement colors etc

  //round off floating point values so you can plot them
  x = Math.round(this.x);
  y = Math.round(this.y);
  setPixel(imageData, x, y, 255, 0, 0, 255);
  //console.log("drew to board (" + x + "," + y + ").");
  context.putImageData(imageData, 0,0);
};

WallRobot.prototype.gotoStepDelta = function (maxSpeed) {
  // actuate the steppers here, or at least simulate it

  throw new Error("broken fn. TODO.")

  if (typeof(this.nextStepDelta) === 'undefined') {
    throw new Error("No next step! nextStepDelta is undefined.");
  }
  if (typeof(maxSpeed) === 'undefined') { maxSpeed  = this.DEFAULT_SPEED; }

  var left_steps = this.nextStepDelta[0] - this.stepDelta[0];
  var right_steps = this.nextStepDelta[1] - this.stepDelta[1];
  var fastTimerId;
  var slowTimerId;
  var fastIndex;
  var slowIndex;
  var fast_steps;
  var slow_steps;
  var fastDir;
  var slowDir;

  if (left_steps > 0 || right_steps > 0) {
    if (left_steps > right_steps) {
      // left_stepper has more steps to make, so it moves at the given speed
      // while right_stepper moves at a fraction of that speed
      // so they both finish at the same time, hopefully!

      fastIndex = 0;
      slowIndex = 1;
      fast_steps = left_steps;
      slow_steps = right_steps;

      // JOHNNY-FIVE CODE
      // left_stepper.rpm(maxSpeed).cw().step(left_steps, cb);
      // right_stepper.rpm(maxSpeed*right_steps/left_steps).ccw().step(right_steps, cb);
    } else {
      //visa versa, since right_steps > left_steps

      fastIndex = 1;
      slowIndex = 0;
      fast_steps = right_steps;
      slow_steps = left_steps;

      // JOHNNY-FIVE CODE
      // left_stepper.rpm(maxSpeed*left_steps/right_steps).cw().step(left_steps, cb);
      // right_stepper.rpm(maxSpeed).ccw().step(right_steps, cb);
    }

    slowDir = slow_steps > 1 ? 1 : -1;
    fastDir = fast_steps > 1 ? 1 : -1;

    slowTimerId = window.setInterval( function () {
      this.stepDelta[slowIndex] += slowDir;
    }.bind(this), maxSpeed*slow_steps/fast_steps);

    fastTimerId = window.setInterval( function () {
      this.stepDelta[fastIndex] += fastDir;
      if (this.stepDelta[fastIndex] === this.nextStepDelta[fastIndex]) {
        console.log("done stepping to new delta!");
        window.clearInterval(slowTimerId);
        window.clearInterval(fastTimerId);

        // update the stepDelta to its new position
        this.stepDelta = this.nextStepDelta.slice();
      }
      this.drawToBoard();
    }.bind(this), maxSpeed);
  } else {
    console.log("Didn't move, nextStepDelta is the same as current stepDelta.");
  }

};


// ===============================================

function setPixel(imageData, x, y, r, g , b, a) {
  var index = (x+y*imageData.width)*4;
  imageData.data[index+0] = r;
  imageData.data[index+1] = g;
  imageData.data[index+2] = b;
  imageData.data[index+3] = a; //255 is opaque, 0 is transparent
}

function randomNoise() {
//just for fun
  var x = Math.floor(Math.random()*imageData.width);
  var y = Math.floor(Math.random()*imageData.height);
  setPixel(imageData,
    x, y, 255,0,0,255);
  // console.log(x,y);
  context.putImageData(imageData, 0, 0);
}

// randomNoise with setIntervalX
// setIntervalX(randomNoise, 1, 1000,
//   function () { console.log("done"); } );

// start!!!
var robot = new WallRobot({
  MOTOR_SIDE_OFFSET: Convert.ft_mm(2),
  MOTOR_HEIGHT: Convert.ft_mm(2),
  DRAW_AREA_WIDTH: Convert.ft_mm(8),
  DRAW_AREA_HEIGHT: Convert.ft_mm(4),
  STRING_LEN_PER_STEP: 1.5, //??? dunno! TODO measure.
  DEFAULT_SPEED: 10, // ??? what units is this even in?? steps/ms? mm/ms?
});

//test update and draw!
robot.setDeltaByCoords(100,200);
//robot.gotoStepDelta();
