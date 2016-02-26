// TODO: Make a namespace for the canvas variables
var canvas = document.getElementById("canvas1");
var context = canvas.getContext("2d");
var imageData = context.createImageData(canvas.width, canvas.height);

// Begin socket.io connection (auto-discovery)
var socket = io();
console.log("TODO: get robot coordinates & draw area info from server upon connection");

// canvas.addEventListener("mousedown", canvasMouseDown);
canvas.addEventListener("mouseup", canvasMouseUp);

function canvasMouseUp(event) {
  // draw a line from the "current position" stepDelta to given destDelta.
  var mouseupCoords = [event.pageX - canvas.offsetLeft, event.pageY - canvas.offsetTop];

  drawStraightLine( getBipolarCoords(mouseupCoords[0], mouseupCoords[1]), function(){
      console.log('line drawn.');
  });
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

//==============TODO: Separate into diff files??? ==============//

var plotBot = {};

// Color as used by context.strokeStyle (right now, used only by drawSubsteps)
plotBot.COLOR = "rgba(255,0,0,0.25)";

// The distance of each step (eg, mm of string retracted/extended)
plotBot.STEP_LEN = 1; //TODO: real value!

// horizontal dist btw the 2 stepper motors.
// plotBot.WIDTH = canvas.width;
plotBot.WIDTH = 2743; //mm

// Keep track of steps from the origin position for left and right motors.
// it should always be an integer. Negative values are OK.
// XXX: this value is about center, for the original board resolution & size. May change.
plotBot.stepDelta = [430/plotBot.STEP_LEN, -300/plotBot.STEP_LEN];

function isInt(value) {
  // from krisk on http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
  return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value));
}

function step(stepsLeft, stepsRight) {
    // Performs a single step with one or both motors.
    // Currently only used by d/f/j/k keypress events.
    //steps is positive -> extend string
    //steps is negative -> retract string

    // if (!isInt(stepsLeft) || !isInt(stepsRight)) {
    //   throw new Error("Steps must be an integer! Got " + stepsLeft + ", " + stepsRight);
    // }

    if((stepsLeft !== 0 && Math.abs(stepsLeft) !== 1 ) ||
    (stepsRight !== 0 && Math.abs(stepsRight) !== 1)) {
        throw new Error("Steps can only be -1, 0, or 1");
    }

    // Emit a step event to the server
    console.log("requesting step from server...");
    socket.emit('step', {'stepsLeft':stepsLeft, 'stepsRight': stepsRight}, function(response) {
        if (response.ok) {
            console.log("got OK from server");

            var prevStepDelta = plotBot.stepDelta.slice();

            //Update stepDelta with new position
            plotBot.stepDelta[0] += stepsLeft;
            plotBot.stepDelta[1] += stepsRight;

            var newStepDelta = plotBot.stepDelta.slice();

            updateCursor();
            drawSubsteps(prevStepDelta,newStepDelta);
        } else {
            console.log("non-ok response from server:");
            console.log(response);
        }
    });
}

function cartesianLength(x0, y0, x1, y1) {
    // the distance formula!
    return Math.sqrt(Math.pow(x1-x0,2)+Math.pow(y1-y0,2));
}

function drawSubsteps(prevStepDelta,newStepDelta) {
  // Draw the sampled points across the displacement
  var coords;
  var substepResolution = 4; //for spotty dotty trace, use 2.
  var deltaDiff = [];

  context.strokeStyle = plotBot.COLOR;

  for (var diff_i = 0; diff_i < 2; diff_i++) {
    deltaDiff[diff_i] = newStepDelta[diff_i] - prevStepDelta[diff_i];
  }
  var biggestDiff = Math.abs(deltaDiff[0]) > Math.abs(deltaDiff[1]) ? Math.abs(deltaDiff[0]) : Math.abs(deltaDiff[1]);
  var totalSubsteps = biggestDiff*substepResolution;

  function subStepMap(substep_i, index) {
    return prevStepDelta[index] + ((newStepDelta[index] - prevStepDelta[index]) * substep_i / totalSubsteps);
  }

  for (var substep_i = 0; substep_i < totalSubsteps; substep_i++) {
    // this should take the step directions as input, and draw a certain number
    // of points between those directions.

    tempStepDelta = _.map([substep_i,substep_i], subStepMap);

    coords = getCartesian(tempStepDelta);
    drawCircle(coords.x, coords.y, 1);
  }
}

function getBipolarCoords(x,y) {
  var steps_l = Math.sqrt(Math.pow(x,2) + Math.pow(y,2)) / plotBot.STEP_LEN;
  var steps_r = (Math.sqrt(Math.pow(plotBot.WIDTH - x,2) + Math.pow(y,2)) - plotBot.WIDTH) / plotBot.STEP_LEN;

  return [Math.round(steps_l), Math.round(steps_r)];
}

function getCartesian(someStepDelta) {
  //clone the array, it's not necessary - but just to be safe
  someStepDelta = someStepDelta.slice();

  //string lengths
  var s_l = someStepDelta[0]*plotBot.STEP_LEN;
  var s_r = someStepDelta[1]*plotBot.STEP_LEN + plotBot.WIDTH;

  //cartesian coords
  var x = (Math.pow(s_l, 2) - Math.pow(s_r, 2) + Math.pow(plotBot.WIDTH, 2) ) / (2 * plotBot.WIDTH);
  var y = Math.sqrt( Math.abs( Math.pow(s_l, 2) - Math.pow(x,2) ));

  return {x:x, y:y, s_l:s_l, s_r:s_r};
}


function updateCursor() {
  // FIXME bug: something weird happens when you pull
  // the line up too far (enough to "stretch" it)

  var coords = getCartesian(plotBot.stepDelta);

  // draw the cursor position
  context.strokeStyle = "rgba(0, 0, 0, 0.10)";
  drawCircle(coords.x, coords.y, 3);
}


function drawArc(x,y,radius,startAngle,endAngle,counterClockwise) {
  context.beginPath();
  context.arc(x, y, radius, startAngle, endAngle, counterClockwise);
  context.stroke();
}

function drawCircle(x,y,radius) {
  context.beginPath();
  context.arc(x, y, radius, 0, 2*Math.PI, false);
  context.stroke();
}

// Draw the bipolar "grid".
for (var i = 0; i < 1000; i+=plotBot.STEP_LEN) {
  context.strokeStyle = "rgba(255, 0, 0, 0.10)";
  drawArc(0, 0, i, 0, 2*Math.PI, false);

  context.strokeStyle = "rgba(0, 0, 255, 0.10)";
  drawArc(plotBot.WIDTH, 0, i, 0, 2*Math.PI, false);
}

function drawStraightLine(destDelta, callback) {
    // Draws an approximately straight line with both motors simultaneously.
    // The robot's real-life line isn't perfect,
    // but we draw it as a straight line on the canvas.

    delta = {
        'leftDelta': destDelta[0] - plotBot.stepDelta[0],
        'rightDelta': destDelta[1] - plotBot.stepDelta[1]
    };

    console.log("requesting straight line mvmt from server...");
    socket.emit('line', delta, function(response){
        if (response.ok) {
            console.log('ok line from server');

            // Canvas draw, without using step()
            context.beginPath();
            var startCoords = getCartesian(plotBot.stepDelta);
            var endCoords = getCartesian(destDelta);
            context.moveTo(startCoords.x, startCoords.y);
            context.lineTo(endCoords.x, endCoords.y);
            context.strokeStyle = "rgba(190, 36, 210, 0.6)";
            context.stroke();

            // update the plotBot.stepDelta
            plotBot.stepDelta = destDelta.slice();

            // execute the callback
            callback();
        } else {
            console.log('line error from server: ' + response);
        }
    });

}
