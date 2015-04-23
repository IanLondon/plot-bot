var canvas = document.getElementById("canvas1");
var context = canvas.getContext("2d");
var imageData = context.createImageData(canvas.width, canvas.height);

var Convert = {
  ft_mm : function(ft) {
    //1 ft = 304.8 mm
    return ft * 304.8; }
};


//steps for left and right stepper, from origin position.
var steps = [0,0];


var draw_area = new Victor (Convert.ft_mm(8),Convert.ft_mm(4));

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
