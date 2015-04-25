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

  // horizontal distance from motors to side of board in mm
  this.MOTOR_SIDE_OFFSET = opts.MOTOR_SIDE_OFFSET;

  // height of motors above top of drawing area in mm
  this.MOTOR_HEIGHT = opts.MOTOR_HEIGHT;

  this.DRAW_AREA_WIDTH = opts.DRAW_AREA_WIDTH;
  this.DRAW_AREA_HEIGHT = opts.DRAW_AREA_HEIGHT;

  this.STRING_LEN_PER_STEP = opts.STRING_LEN_PER_STEP;

  // Right now displacement vectors are named like l_p meaning point L to point P.
  // CONSTANT vectors are uppercase and variable vectors are lowercase.
  //
  // **** VECTOR SYMBOL KEY ****
  // L   Left Stepper Rotor position
  // R   Right Stepper Rotor position
  // O   Origin of drawing area, where (x,y) = (0,0)
  // P   Marker Position

  // this.o_p = new Victor(0, 0);
  this.L_R = new Victor(this.MOTOR_SIDE_OFFSET*2 + this.DRAW_AREA_WIDTH, 0); //horizontal dist btw steppers

  // Assume that both steppers have the same y-axis displacement from
  // their side of the drawing area.
  // IE, they should be horizontally centered.
  this.L_O = new Victor(this.MOTOR_SIDE_OFFSET, this.MOTOR_HEIGHT);

  //The marker starts at (0,0) so L_O = l_p
  this.l_p = this.L_O.clone();

  // TODO SOON use a getter instead, this is an ugly hack!!!
  this.get_r_p = function() { return new Victor(this.l_p.x - this.L_R.x, this.l_p.y);};
  // calculate r_p
  this.r_p = this.get_r_p();

  // TODO SOON same hack ugh
  this.get_o_p = function() { return this.l_p.clone().subtract(this.L_O); };
  this.o_p = this.get_o_p();

  //initialize string lengths
  this.string_len_left = this.l_p.length();
  this.string_len_right = this.r_p.length();


  this.sanityCheck = function () {
    var TOLERANCE_AMT = 0.00000000001; //allow for rounding errors

    //constant scalars that should be > 0
    _.forEach([
      "MOTOR_SIDE_OFFSET",
      "MOTOR_HEIGHT",
      "DRAW_AREA_WIDTH",
      "DRAW_AREA_HEIGHT"],
      function(param) {

      if (this[param] <= 0) {
        throw new Error(
          param + " must be > 0."
        );
      }
    }, this);

    //vectors that should always be positive in both components:
    _.forEach([
      "L_R",
      "L_O",
      "l_p",
      "o_p"],
      function(vect){

      if (this[vect].x < 0 || this[vect].y < 0) {
        throw new Error(vect + " should be positive in both components");
      }

    }, this);

    //r_p is the only vector that should always have a <= 0 x component
    if(this.r_p.x > 0) {
      throw new Error("r_p should not have an x component > 0");
    }

    if(this.L_R.y !== 0) {
      throw new Error("L_R should not have a horizontal component.");
    }

    if(this.l_p.y !== this.r_p.y) {
      throw new Error("l_p and r_p should have the same y value.");
    }

    if(Math.abs(this.l_p.length() - this.string_len_left) > TOLERANCE_AMT) {
      throw new Error("l_p's length should ~equal string_len_left.");
    }

    if(Math.abs(this.r_p.length() - this.string_len_right) > TOLERANCE_AMT) {
    throw new Error("r_p's length should ~equal string_len_right.");
    }

  };

  this.update = function() {
    //Use string length values to update everything else,
    //then do a sanityCheck and lastly drawToBoard.
    this.l_p.x = (( Math.pow(this.string_len_left,2) - Math.pow(this.string_len_right,2) +
       Math.pow(this.L_R.x,2) ) / (2 * this.L_R.x) );

    this.l_p.y = Math.sqrt(Math.pow(this.string_len_left, 2) - Math.pow(this.l_p.x, 2) );

    this.o_p = this.get_o_p();

    //recalculate r_p
    // this.r_p = new Victor(this.l_p.x - this.L_R.x, this.l_p.y);
    this.r_p = this.get_r_p();

    this.sanityCheck();
    drawToBoard(this.o_p.x,this.o_p.y);
  };


  //do a sanity check on init of new WallRobot
  this.sanityCheck();
};

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
  robot.update();
}
