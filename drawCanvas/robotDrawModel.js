var canvas = document.getElementById("canvas1");
var context = canvas.getContext("2d");
var imageData = context.createImageData(canvas.width, canvas.height);

// TODO: store all variables in the plotBot namespace
var plotBot = {};

var STEP_LEN = 10;

// Cartesian resolution sets the granularity when approximating a straight line.
plotBot.CARTESIAN_RESOLUTION = STEP_LEN;
// I'm trying the resolution as the step length... will it work??

// horizontal dist btw the 2 stepper motors.
var WIDTH = canvas.width;

// Keep track of steps from the origin position for left and right motors.
// it should always be an integer. Negative values are OK.
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

function moveStraightTo(destDelta) {
  // Negotiate a "symmetrical" path of step()'s to get from current stepDelta
  // to destDelta (destination): prefers to move both motors at once, and to
  // distribute the single-motor motions evenly along the path.

  // TODO: Verify that the destDelta is an array of 2 integers, and that it is
  // within the bounds of the drawing area.

  // TODO: Make another function that divides a cartesian line into samples,
  // Use plotBot.CARTESIAN_RESOLUTION to determine how many samples to make,
  // each sample is an arc where the endpoints are integer bipolar approximations
  // of the cartesian line.

  var stepDisplacement, stepDirection;
  var totalSteps, totalDualSteps, totalSingleSteps;
  var primaryMvmt, secondaryMvmt;

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

  totalDualSteps = _.min(totalSteps);

  totalSingleSteps = _.max(totalSteps) - totalDualSteps;

  if (totalDualSteps === 0 || totalSingleSteps === 0) {
    secondaryMvmt = [];
    primaryMvmt = (totalDualSteps > totalSingleSteps) ? [totalDualSteps] : [totalSingleSteps];
  }
  else if (totalDualSteps < totalSingleSteps) {
    secondaryMvmt = intChunk(totalDualSteps, totalDualSteps);
    primaryMvmt = intChunk(totalSingleSteps, totalDualSteps+1);
  } else {
    secondaryMvmt = intChunk(totalSingleSteps, totalSingleSteps);
    primaryMvmt = intChunk(totalDualSteps, totalSingleSteps+1);
  }

  console.log({primaryMvmt:primaryMvmt, secondaryMvmt:secondaryMvmt});

  _.forEach(secondaryMvmt, function(val,index) {
    TODO
  });
  // there's always one more movement chunk in primaryMvmt than in secondaryMvmt
  // so make that last movement now:
    STEP HERE

  // var biggerSteps;
  // if (total_steps_left > total_steps_right) {
  //   biggerSteps = total_steps_left;
  //   stepBig = function() { step(left_dir,0); };
  // } else {
  //   biggerSteps = total_steps_right;
  //   stepBig = function() { step(0,right_dir); };
  // }
  // biggerSteps -= stepDiff;
  //
  // var bigStepArray = intChunk(biggerSteps, stepDiff);
  //
  // _.forEach(bigStepArray, function(bigSteps) {
  //   _.times(bigSteps, stepBig);
  // });

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

// function drawLine(x0,y0,x1,y1) {
//   // Draws a straight line using Cartesian coordinates.
//
//   var length = cartesianLength(x0,y0,x1,y1);
//   // var slope = (y1-y0)/(x1-x0);
//   var segments = length / plotBot.CARTESIAN_RESOLUTION;
//
//   // for short lines or low res,
//   //make sure you don't have a fractional segment number.
//   if (segments < 1) {
//     segments = 1;
//   }
//
//   // the difference per segment
//   var d_xy = [(x1-x0)/segments, (y1-y0)/segments];
//
//   var current_xy = [x0, y0];
//
//   // keep track of how many times you recalculated and got the same stepDelta
//   var skipped = 0;
//
//   console.log("line length is: " + length);
//   console.log("Split line up into " + segments + " segments.");
//   console.log("d_xy is " + d_xy);
//
//   //debug: first draw the ideal line you want.
//   context.strokeStyle = "rgba(215, 113, 168, 0.5)";
//   context.moveTo(x0,y0);
//   context.lineTo(x1,y1);
//   context.stroke();
//
//   for(var i = 0; i < segments; i++) {
//     for(var j = 0; j < 2; j++) {
//       current_xy[j] += d_xy[j];
//     }
//     console.log("x,y = " + current_xy);
//     var nextDelta = getBipolarCoords.apply(null,current_xy);
//     if (nextDelta != stepDelta) {
//       // move if you got a new position.
//       console.log("stepping to " + nextDelta);
//       straightLineTo(nextDelta);
//     }
//     else {
//       skipped++;
//     }
//   }
//
//   console.log("skipped: " + skipped);
//
// }

function drawSubsteps(prevStepDelta,newStepDelta) {
  // Draw the sampled points across the displacement
  var coords;
  var substepResolution = 4; //for spotty dotty trace, use 2.
  var deltaDiff = [];

  context.strokeStyle = "rgba(255,0,0,0.5)";

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
    drawCircle(coords.x, coords.y, 1, 0, 2*Math.PI);
  }
}

//TODO next: make a getClosestXY which returns a stepDelta.
// it's the inverse function of getCartesian.
// copy from old drawCanvas.js??

function getBipolarCoords(x,y) {
  var steps_l = Math.sqrt(Math.pow(x,2) + Math.pow(y,2)) / STEP_LEN;
  var steps_r = (Math.sqrt(Math.pow(WIDTH - x,2) + Math.pow(y,2)) - WIDTH) / STEP_LEN;

  return [Math.round(steps_l), Math.round(steps_r)];
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

// test stuff
// drawLine(100,100,300,400);
stepDelta = [100,100];
moveStraightTo([300,400]);
// straightLineTo([300,400]);
console.log(stepDelta);
