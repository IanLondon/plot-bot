var canvas = document.getElementById("canvas1");
var context = canvas.getContext("2d");
var imageData = context.createImageData(canvas.width, canvas.height);

var Convert = {
  //TODO separate this into module? acts like Math.
  ft_mm : function(ft) {
    //1 ft = 304.8 mm
    return ft * 304.8; }
};


var WallRobot = function(opts) {
  //all working units are in MM! MM is "native".

  // stepperDelta tracks steps from the origin position.
  // Negative values retract the string, positive values extend the string
  // stepperDelta[0] is left stepper, and stepperDelta[1] is right stepper.
  this.stepperDelta = [0, 0];

  // horizontal distance from motors to side of board in mm
  this.MOTOR_SIDE_OFFSET = opts.MOTOR_SIDE_OFFSET;

  // height of motors above top of drawing area in mm
  this.MOTOR_HEIGHT = opts.MOTOR_HEIGHT;

  this.DRAW_AREA_WIDTH = opts.DRAW_AREA_WIDTH;
  this.DRAW_AREA_HEIGHT = opts.DRAW_AREA_HEIGHT;

  this.STRING_LEN_PER_STEP = opts.STRING_LEN_PER_STEP;

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
      "MOTOR_TO_MOTOR_DIST"
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

    // //vectors that should always be positive in both components:
    // _.forEach([
    //   "L_R",
    //   "L_O",
    //   "l_p",
    //   "o_p"],
    //   function(vect){
    //
    //   if (this[vect].x < 0 || this[vect].y < 0) {
    //     throw new Error(vect + " should be positive in both components");
    //   }
    //
    // }, this);

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


  // this.update = function() {
  //   // //Use string length values to update everything else,
  //   // //then do a sanityCheck and lastly drawToBoard.
  //   // this.l_p.x = (( Math.pow(this.string_len_left,2) - Math.pow(this.string_len_right,2) +
  //   //    Math.pow(this.L_R.x,2) ) / (2 * this.L_R.x) );
  //   //
  //   // this.l_p.y = Math.sqrt(Math.pow(this.string_len_left, 2) - Math.pow(this.l_p.x, 2) );
  //   //
  //   // this.o_p = this.get_o_p();
  //   //
  //   // //recalculate r_p
  //   // // this.r_p = new Victor(this.l_p.x - this.L_R.x, this.l_p.y);
  //   // this.r_p = this.get_r_p();
  //
  //   this.checkPosition();
  //   drawToBoard(this.x, this.y);
  // };


  //do a sanity check on init of new WallRobot


// Getters (and setters, if you make any)
Object.defineProperties(WallRobot.prototype, {

  string_len_left : {
    get: function() {
      return this.stepperDelta[0]*this.STRING_LEN_PER_STEP + this.INITIAL_STR_LEN_LEFT;
    }
  },

  string_len_right : {
    get: function() {
      return this.stepperDelta[1]*this.STRING_LEN_PER_STEP + this.INITIAL_STR_LEN_RIGHT;
    }
  },

  x : {
    get: function() {
      return (( Math.pow(this.string_len_left,2) - Math.pow(this.string_len_right,2) +
        Math.pow(this.MOTOR_TO_MOTOR_DIST,2) ) / (2 * this.MOTOR_TO_MOTOR_DIST) );
    }
  },

  y : {
    get: function() {
      //TODO: this can probably be more efficient (not calling x.get()...)
      return Math.sqrt(Math.pow(this.string_len_left, 2) - Math.pow(this.x, 2) );
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

WallRobot.prototype.setDeltaByCoords = function(x, y) {
  // TODO
};

WallRobot.prototype.setDeltaByLengths = function(left_len, right_len) {
  // TODO
};



// ===============================================

function drawToBoard(x, y) {
  // instead of calling setPixel directly, this is kind of a hook.
  // later I will implement colors etc

  //round off floating point values so you can plot them
  x = Math.round(x);
  y = Math.round(y);
  setPixel(imageData, x, y, 255, 0, 0, 255);
  console.log("drew to board (" + x + "," + y + ").");
  context.putImageData(imageData, 0,0);
}

function setPixel(imageData, x, y, r, g , b, a) {
  var index = (x+y*imageData.width)*4;
  imageData.data[index+0] = r;
  imageData.data[index+1] = g;
  imageData.data[index+2] = b;
  imageData.data[index+3] = a; //255 is opaque, 0 is transparent
}

function randomNoise() {
//just for fun
  for (var i = 0; i < 100000; i++) {
    var x = Math.floor(Math.random()*imageData.width);
    var y = Math.floor(Math.random()*imageData.height);
    setPixel(imageData,
      x, y, 255,0,0,255);
    // console.log(x,y);
  }
  context.putImageData(imageData, 0,0);
}

// start!!!
var robot = new WallRobot({
  MOTOR_SIDE_OFFSET: Convert.ft_mm(2),
  MOTOR_HEIGHT: Convert.ft_mm(2),
  DRAW_AREA_WIDTH: Convert.ft_mm(8),
  DRAW_AREA_HEIGHT: Convert.ft_mm(4),
  STRING_LEN_PER_STEP: 1.5 //??? dunno! TODO measure.
});

//test update and draw!
for(var i = 0; i < 500; i++) {
  robot.string_len_right += robot.STRING_LEN_PER_STEP;
  // robot.update();
}
