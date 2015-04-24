var canvas = document.getElementById("canvas1");
var context = canvas.getContext("2d");
var imageData = context.createImageData(canvas.width, canvas.height);

var Convert = {
  //TODO separate this into module? act like Math.
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

  //steps for left and right stepper, from origin position.
  this.steps = [0,0];

  // Right now displacement vectors are named like l_p meaning point L to point P.
  // CONSTANT vectors are uppercase and variable vectors are lowercase.
  //
  // **** VECTOR SYMBOL KEY ****
  // L   Left Stepper Rotor position
  // R   Right Stepper Rotor position
  // O   Origin of drawing area, where (x,y) = (0,0)
  // P   Marker Position

  this.o_p = new Victor(0, 0);
  this.L_R = new Victor(0, this.MOTOR_SIDE_OFFSET*2 + this.DRAW_AREA_WIDTH); //horizontal dist btw steppers

  // Assume that both steppers have the same y-axis displacement from
  // their side of the drawing area.
  // IE, they should be horizontally centered.
  this.L_O = new Victor(this.MOTOR_SIDE_OFFSET, this.MOTOR_HEIGHT);

  //The marker starts at (0,0) so L_O = l_p
  this.l_p = this.L_O.clone();

  this.sanityCheck = function () {
    _.forEach([MOTOR_SIDE_OFFSET, MOTOR_HEIGHT, DRAW_AREA_WIDTH, DRAW_AREA_HEIGHT], function(param) {
      if (! this[param] > 0) {
        throw new Error(
          param + " must be > 0."
        );
      }
    });
  }
};


function setPixel(imageData, x, y, r, g , b, a) {
  var index = (x+y*imageData.width)*4;
  imageData.data[index+0] = r;
  imageData.data[index+1] = g;
  imageData.data[index+2] = b;
  imageData.data[index+3] = a;
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
  DRAW_AREA_HEIGHT: Convert.ft_mm(4)
});
