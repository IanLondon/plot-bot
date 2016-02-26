// TODO: Make a namespace for the canvas variables
var canvas = document.getElementById("canvas1");
var context = canvas.getContext("2d");
var imageData = context.createImageData(canvas.width, canvas.height);

var virtualBot = {
    cursorPos: [0,0],
    lineColor: "rgba(190, 36, 210, 0.6)",
    scaleFactor: 1, //this will be changed up update event.
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

// Begin socket.io connection (auto-discovery)
var socket = io();

function scaleCanvas(height, width) {
    // scale the <canvas> to a given height and width,
    // within max thresholds.
    //
    // Also, update the scaling factor:
    // rel. cartesian * scaleFactor -> canvas pixels

    var MAX_HEIGHT = 600;
    var MAX_WIDTH = 1000;
    var given_aspect = height/width;
    var max_aspect = MAX_HEIGHT/MAX_WIDTH;
    var scaleFactor;

    if (given_aspect <= max_aspect) {
        // given rectangle size is shorter & broader
        // (or the same)
        // so give it the maximum width
        scaleFactor = MAX_WIDTH/width;
        canvas.height = height * scaleFactor;
        canvas.width = MAX_WIDTH;
        console.log('shorter (or same)');
    } else {
        // given rect is taller and skinnier
        // so give it max height
        scaleFactor = MAX_HEIGHT/height;
        canvas.height = MAX_HEIGHT;
        canvas.width = width * scaleFactor;
        console.log('taller');
    }

    console.log('height, width: ' + canvas.height, canvas.width);
    console.log('scale is ' + scaleFactor);
    //TODO: update virtualBot.scaleFactor
    virtualBot.scaleFactor = scaleFactor;
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
