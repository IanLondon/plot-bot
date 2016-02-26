// TODO: Make a namespace for the canvas variables
var canvas = document.getElementById("canvas1");
var context = canvas.getContext("2d");
var imageData = context.createImageData(canvas.width, canvas.height);

var virtualBot = {
    cursorPos: [0,0],
    lineColor: "rgba(190, 36, 210, 0.6)",
};

// canvas.addEventListener("mousedown", canvasMouseDown);
canvas.addEventListener("mouseup", canvasMouseUp);

function canvasMouseUp(event) {
  // draw a line from the "current position" stepDelta to given destDelta.
  var mouseupCoords = [event.pageX - canvas.offsetLeft, event.pageY - canvas.offsetTop];

  drawStraightLine(mouseupCoords[0], mouseupCoords[1], function(){
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

// Color as used by context.strokeStyle (right now, used only by drawSubsteps)
// plotBot.COLOR = "rgba(255,0,0,0.25)";

// Begin socket.io connection (auto-discovery)
var socket = io();

function scaleCanvas(height, width) {
    // scale the <canvas> to a given height and width,
    // within max thresholds.
    // FIXME: this doesn't enforce thresholds!!!
    var MAX_HEIGHT = 600;
    var MAX_WIDTH = 1000;
    var aspect_ratio = height/width;

    if (aspect_ratio > 1) {
        // portrait orientation
        canvas.height = MAX_HEIGHT;
        canvas.width = MAX_HEIGHT/aspect_ratio;
    } else {
        // landscape (or square)
        canvas.width = MAX_WIDTH;
        canvas.height = MAX_WIDTH*aspect_ratio;
    }
    console.log(canvas.width, canvas.height);
}

socket.on('update', function(data) {
    console.log("update from server.");
    console.log(data);
    virtualBot.cursorPos = data.coords;
    scaleCanvas(data.canvasHeight, data.canvasWidth);
});

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
        if (response.status == "ok") {
            console.log("got OK from server");
            console.log(response);
            updateCursor(response.dest);
        } else {
            console.log("non-ok response from server:");
            console.log(response);
        }
    });
}

// function cartesianLength(x0, y0, x1, y1) {
//     // the distance formula!
//     return Math.sqrt(Math.pow(x1-x0,2)+Math.pow(y1-y0,2));
// }

// function drawSubsteps(prevStepDelta,newStepDelta) {
//   // Draw the sampled points across the displacement
//   var coords;
//   var substepResolution = 4; //for spotty dotty trace, use 2.
//   var deltaDiff = [];
//
//   context.strokeStyle = plotBot.COLOR;
//
//   for (var diff_i = 0; diff_i < 2; diff_i++) {
//     deltaDiff[diff_i] = newStepDelta[diff_i] - prevStepDelta[diff_i];
//   }
//   var biggestDiff = Math.abs(deltaDiff[0]) > Math.abs(deltaDiff[1]) ? Math.abs(deltaDiff[0]) : Math.abs(deltaDiff[1]);
//   var totalSubsteps = biggestDiff*substepResolution;
//
//   function subStepMap(substep_i, index) {
//     return prevStepDelta[index] + ((newStepDelta[index] - prevStepDelta[index]) * substep_i / totalSubsteps);
//   }
//
//   for (var substep_i = 0; substep_i < totalSubsteps; substep_i++) {
//     // this should take the step directions as input, and draw a certain number
//     // of points between those directions.
//
//     tempStepDelta = _.map([substep_i,substep_i], subStepMap);
//
//     coords = getCartesian(tempStepDelta);
//     drawCircle(coords.x, coords.y, 1);
//   }
// }
//
// function getBipolarCoords(x,y) {
//   var steps_l = Math.sqrt(Math.pow(x,2) + Math.pow(y,2)) / plotBot.STEP_LEN;
//   var steps_r = (Math.sqrt(Math.pow(plotBot.WIDTH - x,2) + Math.pow(y,2)) - plotBot.WIDTH) / plotBot.STEP_LEN;
//
//   return [Math.round(steps_l), Math.round(steps_r)];
// }
//
// function getCartesian(someStepDelta) {
//   //clone the array, it's not necessary - but just to be safe
//   someStepDelta = someStepDelta.slice();
//
//   //string lengths
//   var s_l = someStepDelta[0]*plotBot.STEP_LEN;
//   var s_r = someStepDelta[1]*plotBot.STEP_LEN + plotBot.WIDTH;
//
//   //cartesian coords
//   var x = (Math.pow(s_l, 2) - Math.pow(s_r, 2) + Math.pow(plotBot.WIDTH, 2) ) / (2 * plotBot.WIDTH);
//   var y = Math.sqrt( Math.abs( Math.pow(s_l, 2) - Math.pow(x,2) ));
//
//   return {x:x, y:y, s_l:s_l, s_r:s_r};
// }


function updateCursor(dest) {
    // takes the server's response and updates the cursor,
    // drawing a line from the previous position
    context.beginPath();
    context.moveTo(virtualBot.cursorPos[0], virtualBot.cursorPos[1]);
    context.lineTo(dest.x, dest.y);
    context.strokeStyle = virtualBot.lineColor;
    context.stroke();
    // update virtual cursor
    virtualBot.cursorPos = [dest.x, dest.y];
}


// function drawArc(x,y,radius,startAngle,endAngle,counterClockwise) {
//   context.beginPath();
//   context.arc(x, y, radius, startAngle, endAngle, counterClockwise);
//   context.stroke();
// }
//
// function drawCircle(x,y,radius) {
//   context.beginPath();
//   context.arc(x, y, radius, 0, 2*Math.PI, false);
//   context.stroke();
// }
//
// // Draw the bipolar "grid".
// for (var i = 0; i < 1000; i+=plotBot.STEP_LEN) {
//   context.strokeStyle = "rgba(255, 0, 0, 0.10)";
//   drawArc(0, 0, i, 0, 2*Math.PI, false);
//
//   context.strokeStyle = "rgba(0, 0, 255, 0.10)";
//   drawArc(plotBot.WIDTH, 0, i, 0, 2*Math.PI, false);
// }

function drawStraightLine(x, y, callback) {
    // Draws an approximately straight line with both motors simultaneously.
    // (x,y) is the destination.

    // The robot's real-life line isn't perfect,
    // but we draw it as a straight line on the canvas.

    console.log("requesting straight line mvmt from server...");
    socket.emit('line', {x:x, y:y}, function(response){
        if (response.status == 'ok') {
            console.log('ok line from server');
            console.log(response);
            updateCursor(response.dest);

            // execute the callback
            callback();
        } else {
            console.log('line error from server: ' + response);
        }
    });

}
