// TODO: Make a namespace for the canvas variables
var canvas = document.getElementById("canvas1");
var context = canvas.getContext("2d");
var imageData = context.createImageData(canvas.width, canvas.height);

canvas.addEventListener("mousedown", canvasClick);

function canvasClick(event) {
  // WARNING: this is not robust. If the canvas is not positioned relative to
  // the whole page (not nested), and maybe if you scroll, it can cause problems.
  var coords = [event.pageX - canvas.offsetLeft, event.pageY - canvas.offsetTop];
  console.log(coords);
  return coords;
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

plotBot.STEP_LEN = 10;

// Cartesian resolution sets the granularity when approximating a straight line.
// I'm trying the resolution as the step length... will it work??
plotBot.CARTESIAN_RESOLUTION = plotBot.STEP_LEN;

// Color as used by context.strokeStyle (right now, used only by drawSubsteps)
plotBot.COLOR = "rgba(255,0,0,0.25)";

// horizontal dist btw the 2 stepper motors.
plotBot.WIDTH = canvas.width;

// Keep track of steps from the origin position for left and right motors.
// it should always be an integer. Negative values are OK.
// TODO: store this variable in the plotBot namespace
var stepDelta = [0,0];

function isInt(value) {
  // from krisk on http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
  return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value));
}

function intChunk(total, segments) {
  // Given a total value (integer) and a number of segments, build an array of integers
  // which are as close as possible to each other, which sum to the given total.
  // Eg intChunk(20,8) --> [ 3, 3, 3, 3, 2, 2, 2, 2 ].
  // Negative values for 'total' are fine -- all the elements will be negative

  // This is useful when chunking steps to draw a line in a Bresenham-inspired way!

  if (segments < 0 || !isInt(segments)) {
    throw new Error("intChunk needs 'segments' to be a positive integer. Got " + segments);
  }

  if (total === 0 || !isInt(total)) {
    throw new Error("intChunk needs nonzero integer 'total'. Got " + total);
  }

  // Create and populate chunkArray with minimum values
  var chunkArray = [];
  var isPositive = (total > 0);
  // Math.floor rounds negative numbers up: -2.5 --> -3. So use Math.ceil for negatives.
  var initialVal = isPositive ? Math.floor(total/segments) : Math.ceil(total/segments);
  for (var i=0; i<segments; i++) {
    chunkArray.push(initialVal);
  }

  // Go thru array incrementing each element by 1 (if positive) or -1 (if neg)
  // until the sum of the array reaches the value or 'sum'.
  var signedAdder = isPositive ? 1 : -1;
  var runningSum = Math.abs(initialVal * segments);
  var index = 0;
  while (runningSum < Math.abs(total)) {
    chunkArray[index] += signedAdder;
    index = (index + 1 == segments) ? 0 : index + 1;
    runningSum++;
  }

  return chunkArray;
}

  // TODO: Make another function that divides a cartesian line into samples,
  // Use plotBot.CARTESIAN_RESOLUTION to determine how many samples to make,
  // each sample is an arc where the endpoints are integer bipolar approximations
  // of the cartesian line.

function moveRobotTo(destDelta) {
  // Negotiate a "symmetrical" path of step()'s to get from current stepDelta
  // to destDelta (destination): prefers to move both motors at once, and to
  // distribute the single-motor motions evenly along the path.

  // This is really just for the HTML canvas simulator, the steppers can be run
  // simultaneously & asychronously with johnny-five... maybe. XXX

  // TODO: Verify that the destDelta is an array of 2 integers, and that it is
  // within the bounds of the drawing area.

  var stepDisplacement, stepDirection;
  var totalSteps, totalDualSteps, totalSingleSteps, singleStepMotorIndex;
  var biggerStepIndex, smallerStepIndex;
  var primaryMvmt, secondaryMvmt;
  var primaryIsDual;

  stepDisplacement = _.map(stepDelta, function(currentVal,index) {
    return destDelta[index] - currentVal;
  });

  stepDirection = _.map(stepDisplacement, function(steps) {
    if (steps < 0) return -1;
    else if (steps > 0) return 1;
    else return 0;
  });

  totalSteps = _.map(stepDisplacement, function(steps) {
    return Math.abs(steps);
  });

  if (totalSteps[0] >= totalSteps[1]) {
    biggerStepIndex = 0;
    smallerStepIndex = 1;
  } else {
    biggerStepIndex = 1;
    smallerStepIndex = 0;
  }
  singleStepIndex = biggerStepIndex;
  totalSingleSteps = totalSteps[biggerStepIndex] - totalSteps[smallerStepIndex];
  totalDualSteps = totalSteps[smallerStepIndex];

  if (totalDualSteps === 0 || totalSingleSteps === 0) {
    secondaryMvmt = [];
    if (totalDualSteps === totalSingleSteps) {
      console.log("weird, moveRobotTo got 0 steps...");
      return false;
    }
    else if (totalDualSteps > totalSingleSteps) {
      primaryMvmt = [totalDualSteps];
      primaryIsDual = true;
    } else {
      primaryMvmt = [totalSingleSteps];
      primaryIsDual = false;
    }
  }
  else if (totalDualSteps < totalSingleSteps) {
    secondaryMvmt = intChunk(totalDualSteps, totalDualSteps);
    primaryMvmt = intChunk(totalSingleSteps, totalDualSteps+1);
    primaryIsDual = false;
  } else {
    secondaryMvmt = intChunk(totalSingleSteps, totalSingleSteps);
    primaryMvmt = intChunk(totalDualSteps, totalSingleSteps+1);
    primaryIsDual = true;
  }

  // console.log({primaryMvmt:primaryMvmt, secondaryMvmt:secondaryMvmt});


  function dualStep() {
    // stepDelta = _.map(stepDelta, function(currentVal, index){
    //   return currentVal + stepDirection[index];
    // });
    step(stepDirection[0], stepDirection[1]);
  }

  function singleStep() {
    // stepDelta[singleStepIndex] += stepDirection[singleStepIndex];
    if (singleStepIndex === 0) {
      step(stepDirection[0],0);
    } else {
      step(0, stepDirection[1]);
    }
  }

  // move the canvas "cursor" to the beginning stepDelta
  context.beginPath();
  context.strokeStyle = "rgba(255,0,100,1)";
  context.moveTo(stepDelta[0], stepDelta[1]);

  _.forEach(secondaryMvmt, function(secondarySteps,index) {
    if (primaryIsDual) {
      // execute primary mvmt. it's dual.
      _.times(primaryMvmt[index], dualStep);

      // execute secondary mvmt. it's single.
      // since secondary mvmt contains only one step, just call it once.
      singleStep();
    }
    else {
      // primary is singleStep, secondary mvmt is dualStep.
      _.times(primaryMvmt[index], singleStep);
      dualStep();
    }

  });
  // there's always one more movement chunk in primaryMvmt than in secondaryMvmt
  // so make that last movement now:
  // TODO use _.last(primaryMvmt) instead
    if (primaryIsDual) {
      _.times(primaryMvmt[primaryMvmt.length - 1], dualStep);
    } else {
      _.times(primaryMvmt[primaryMvmt.length - 1], singleStep);
    }

    // debug!
    console.log("robot moved to");
    console.log(stepDelta.slice(0));

    if(stepDelta[0] !== destDelta[0] || stepDelta[1] !== destDelta[1]) {
      console.log("...but should have moved to step delta " + destDelta[0] + ", " + destDelta[1]);
      console.log("moveRobotTo() did not wind up at destination!");
    }
}

function step(stepsLeft, stepsRight) {
  // Performs a single step with one or both motors.
  //steps is positive -> extend string
  //steps is negative -> retract string

  // if (!isInt(stepsLeft) || !isInt(stepsRight)) {
  //   throw new Error("Steps must be an integer! Got " + stepsLeft + ", " + stepsRight);
  // }

  if((stepsLeft !== 0 && Math.abs(stepsLeft) !== 1 )
    || (stepsRight !== 0 && Math.abs(stepsRight) !== 1)) {
    throw new Error("Steps can only be -1, 0, or 1");
    // console.log("Warning: multiple steps at once...");
  }

  var prevStepDelta = stepDelta.slice();

  //Update stepDelta with new position
  stepDelta[0] += stepsLeft;
  stepDelta[1] += stepsRight;

  var newStepDelta = stepDelta.slice();

  updateCursor();
  drawSubsteps(prevStepDelta,newStepDelta);

}

function cartesianLength(x0,y0,x1,y1) {
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
  // the line enough to "stretch" it

  var coords = getCartesian(stepDelta);

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

function drawStraightLine(destDelta, timesToSplit) {
  // draw an approximately straight line from current stepDelta
  // to destDelta, by splitting up the cartesian line a given no of times
  var coords0, coords1;
  var x, x0, x1, y, y0, y1;
  var allCoords;

  currentCoords = getCartesian(stepDelta);
  destCoords = getCartesian(destDelta);

  x0 = currentCoords.x;
  y0 = currentCoords.y;
  x1 = destCoords.x;
  y1 = destCoords.y;

  allCartesianCoords = [];
  allBipolarCoords = [];

  if (x1-x0 === 0 && y1-y0 === 0) {
    console.log("drawStraightLine got same coords, skipping.");
  } else {
    for(var i=0; i<=timesToSplit; i++) {
      x = (x1-x0)*i/timesToSplit + x0;
      y = (y1-y0)*i/timesToSplit + y0;

      allCartesianCoords.push([x,y]);
      allBipolarCoords.push(getBipolarCoords(x,y));
    }
  }

  // DEBUG FIXME

  console.log("bipolar & cart");
  console.log( allBipolarCoords );
  console.log( allCartesianCoords);

  _.forEach(allBipolarCoords, function(coords) {
    moveRobotTo(coords);
    // debug: show the bipolar coords in red
    var cartTemp = getCartesian(coords);
    context.strokeStyle = "red";
    drawCircle(cartTemp.x, cartTemp.y, 1);
  });

  // debug: show the cartesian coords in black
  context.strokeStyle = "black";
  _.forEach(allCartesianCoords, function (coords) {
    drawCircle(coords[0], coords[1], 1);
  });

}

//===========TESTS=============

// a horizonal-ish line
// plotBot.COLOR = "rgba(0,255,255,0.25)";
// stepDelta = [10,-5];
// moveRobotTo([57,-55]);

//==== horizonal-ish, lower. ====
// the ideal cartesian line
context.strokeStyle = "pink";
context.moveTo(79, 272);
context.lineTo(627,269);
context.stroke();
// this is a "native" stepper line
plotBot.COLOR = "rgba(0,0,255,0.25)";
stepDelta = getBipolarCoords(79, 272);
moveRobotTo(getBipolarCoords(627, 269));
// now try to approximate it
plotBot.COLOR = "rgba(50,255,0,0.25)";
stepDelta = getBipolarCoords(79, 272);
drawStraightLine(getBipolarCoords(627, 269), 3);

// it's broken, let's try a segment
// stepDelta = [37,-20];
// moveRobotTo([52, -35]);
