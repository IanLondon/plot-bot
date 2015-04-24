var canvas = document.getElementById("canvas1");
var context = canvas.getContext("2d");
var imageData = context.createImageData(canvas.width, canvas.height);

var Convert = {
  //TODO separate this into module? act like Math.
  ft_mm : function(ft) {
    //1 ft = 304.8 mm
    return ft * 304.8; }
};


var WallRobot = function() {
  var MOTOR_DIST = Convert.ft_mm(12); // horizontal distance btw motors in mm
  var MOTOR_HEIGHT = Convert.ft_mm(2); // height of motors above top of drawing area in mm

  //steps for left and right stepper, from origin position.
  var steps = [0,0];

  //x,y are width, height of drawing area in MM.
  //all working units are in MM! MM is "native".
  var draw_area = new Victor (Convert.ft_mm(8),Convert.ft_mm(4));

  // Right now displacement vectors are named like l_p meaning point L to point P.
  // CONSTANT vectors are uppercase and variable vectors are lowercase.
  //
  // **** VECTOR SYMBOL KEY ****
  // L   Left Stepper Rotor position
  // R   Right Stepper Rotor position
  // O   Origin of drawing area, where (x,y) = (0,0)
  // P   Marker Position

  var o_p = new Victor(0, 0);
  var L_R = new Victor(0, MOTOR_DIST)); //horizontal dist btw steppers

  // Assume that both steppers have the same y-axis displacement from
  // their side of the drawing area.
  // IE, they should be horizontally centered.
  var L_O = new Victor( (L_R.x - draw_area.x)/2 , MOTOR_HEIGHT);

  //The marker starts at (0,0) so L_O = l_p
  var l_p = L_O.clone();
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
