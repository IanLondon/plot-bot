var canvas = document.getElementById("canvas1");
var context = canvas.getContext("2d");
var imageData = context.createImageData(canvas.width, canvas.height);

var STEP_LEN = 10;

// horizontal dist btw the 2 stepper motors.
var WIDTH = canvas.width;

// Keep track of steps from the origin position for left and right motors.
// it should always be an integer. Negative values are OK.
var stepDelta = [0,0];

function isInt(value) {
  // from krisk on http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
  return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value));
}

function step(stepsLeft, stepsRight) {
  //steps is positive -> extend string
  //steps is negative -> retract string
  var substepResolution = 2;
  var deltaDiff = [];

  if (!isInt(stepsLeft) || !isInt(stepsRight)) {
    throw new Error("Steps must be an integer! Got " + stepsLeft + ", " + stepsRight);
  }

  var prevStepDelta = stepDelta.slice();

  //Update stepDelta with new position
  stepDelta[0] += stepsLeft;
  stepDelta[1] += stepsRight;

  var newStepDelta = stepDelta.slice();

  // Draw the sampled points across the displacement
  var coords;
  var substeps = [];

  context.strokeStyle = "rgba(255,0,0,0.5)";

  for (var diff_i = 0; diff_i < 2; diff_i++) {
    deltaDiff[diff_i] = newStepDelta[diff_i] - prevStepDelta[diff_i];
  }
  var biggestDiff = Math.abs(deltaDiff[0]) > Math.abs(deltaDiff[1]) ? Math.abs(deltaDiff[0]) : Math.abs(deltaDiff[1]);
  var totalSubsteps = biggestDiff*substepResolution;

  //The sign of the displacement.
  var stepDirections = _.map(deltaDiff,function(val){
    if (val > 0) {
      return 1;
    } else if (val < 0) {
      return -1;
    } else {
      return 0;
    }
  });
  for (var substep_i = 0; substep_i < totalSubsteps; substep_i++) {
    // this should take the step directions as input, and draw a certain number
    // of points between those directions.

    console.log("stepDirections: " + stepDirections);

    tempStepDelta = _.map(prevStepDelta, function(val, index) {
      return val + stepDirections[index]*substep_i/substepResolution;
    });

    console.log("tempStepDelta: " + tempStepDelta);

    coords = getCartesian(tempStepDelta);
    drawCircle(coords.x, coords.y, 1, 0, 2*Math.PI);
  }

  updateCursor();
}

function getCartesian(someStepDelta) {
  //clone the array, it's not necessary - but just to be safe
  someStepDelta = someStepDelta.slice();

  //string lengths
  var s_l = someStepDelta[0]*STEP_LEN;
  var s_r = someStepDelta[1]*STEP_LEN + WIDTH;

  //cartesian coords
  var x = (Math.pow(s_l, 2) - Math.pow(s_r, 2) + Math.pow(WIDTH, 2) ) / (2 * WIDTH);
  var y = Math.sqrt( Math.abs( Math.pow(s_l, 2) - Math.pow(x,2) ));

  return {x:x, y:y, s_l:s_l, s_r:s_r};
}

/*
TODO: make stepL(dir) stepR(di) stepLR(dirL, dirR) instead
of directly inc/dec stepDelta.
Then, make them actually draw the arc!
Then, try to draw a straight line!
*/
function updateCursor() {
  // bug: something weird happens when you pull
  // the line enough to "stretch" it

  var coords = getCartesian(stepDelta);

  // draw the cursor position
  context.strokeStyle = "rgba(0, 0, 0, 0.10)";
  drawCircle(coords.x, coords.y, 3, 0, 2*Math.PI);
}


function drawCircle(x,y,radius,startAngle,endAngle,counterClockwise) {
  context.beginPath();
  context.arc(x, y, radius, startAngle, endAngle, counterClockwise);
  context.stroke();
}

// Draw the possible coordinates in a bipolar "grid".
for (var i = 0; i < 1000; i+=STEP_LEN) {
  context.strokeStyle = "rgba(255, 0, 0, 0.10)";
  drawCircle(0, 0, i, 0, 2*Math.PI, false);

  context.strokeStyle = "rgba(0, 0, 255, 0.10)";
  drawCircle(WIDTH, 0, i, 0, 2*Math.PI, false);
}

document.body.onkeydown = function(event){
    event = event || window.event;
    var keycode = event.charCode || event.keyCode;
    if(keycode === 68){
      //"d" key
      // l_step_retract();
      step(-1,0);
    }
    if(keycode === 70){
      //"f" key
      // l_step_extend();
      step(1,0);
    }
    if(keycode === 75){
      //"k" key
      // r_step_retract();
      step(0,-1);
    }
    if(keycode === 74){
      //"j" key
      // r_step_extend();
      step(0,1);
    }

};