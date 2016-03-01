// function Bezier(2,t,w[]):
//   t2 = t * t
//   mt = 1-t
//   mt2 = mt * mt
//   return w[0]*mt2 + w[1]*2*mt*t + w[2]*t2
//
// function Bezier(3,t,w[]):
//   t2 = t * t
//   t3 = t2 * t
//   mt = 1-t
//   mt2 = mt * mt
//   mt3 = mt2 * mt
//   return w[0]*mt3 + 3*w[1]*mt2*t + 3*w[2]*mt*t2 + w[3]*t3

function bezierToPoint(w, t) {
    // returns an (x,y) point that corresponds to the given t value
    // using weighted basis function
    // w should be an array of points of form = [{x:0,y:0},{x:12,y:15},...]
    // See http://pomax.github.io/bezierinfo/#control
    var t2 = t * t;
    var mt = 1-t;
    var mt2 = mt * mt;

    if (t<0 || t>1) {
        throw new Error("Invalid t value. t should be in [0, 1].");
    }

    if (w.length == 3) {
        // cubic Bezier
        return {
            x: w[0].x*mt2 + w[1].x*2*mt*t + w[2].x*t2,
            y: w[0].y*mt2 + w[1].y*2*mt*t + w[2].y*t2,
        };
    }
    if (w.length == 4){
        // quadratic Bezier
        var t3 = t2 * t;
        var mt3 = mt2 * mt;
        return {
            x: w[0].x*mt3 + 3*w[1].x*mt2*t + 3*w[2].x*mt*t2 + w[3].x*t3,
            y: w[0].y*mt3 + 3*w[1].y*mt2*t + 3*w[2].y*mt*t2 + w[3].y*t3,
        };
    }

    throw new Error("Invalid bezier parameters! Got array with length: " + w.length);
}

function euclidianDist(pointA, pointB) {
    // Euclidian distance between two points

    if (pointA.x < 0 || pointA.y < 0 || pointB.x < 0 || pointB.y < 0) {
        throw new Error("Negative coordinate values not supported.");
    }

    return Math.sqrt(Math.pow((pointB.x - pointA.x), 2) + Math.pow((pointB.y - pointA.y), 2));
}

function bezierSubsection(bez, subsectionCount) {
    // Measures a bezier curve by summing Euclidian distances between points
    // subsectionCount should be higher for more complex or "curvy" curves
    // WARNING: the line segments won't have equal lengths!
    // Returns the total length of the segments, and the points (there are subsectionCount+1 points)

    if (subsectionCount <= 0) {
        throw new Error("subsection count must be greater than 0");
    }

    // Use default if unspecified
    var DEFAULT_SUBSECTION_COUNT = 10;
    subsectionCount = typeof subsectionCount !== 'undefined' ? subsectionCount : DEFAULT_SUBSECTION_COUNT;

    var total_len = 0;
    var points = [];

    // iterate through all the points of the straight-line subsections
    for(i=0; i<=subsectionCount; i++) {
        points.push(bezierToPoint(bez, i/subsectionCount));
        if (i>0) {
            // add length between previous point and current point.
            total_len += euclidianDist(points[i-1], points[i]);
        }
    }

    return {'len':total_len, 'points':points};
}

function drawPoints(points) {
    // TODO: make a version compatable with both points from bezier and points from opentype.js
    var DELAY_BTW_COMMANDS = 100; //TODO: this should be a plotbot property...
    function drawLoop(drawIndex) {
        if (drawIndex >= points.length) {
            // break out of callback loop
            console.log('exiting drawLoop');
            return false;
        }
        var nextCoords = [points[drawIndex].x, points[drawIndex].y];
        console.log('nextCoords (relative cartesian):');
        console.log(nextCoords);
        drawStraightLine(nextCoords[0], nextCoords[1], function(){
            setTimeout(function(){
                drawLoop(drawIndex+1);
            }, DELAY_BTW_COMMANDS);
        });
    }
    // Start drawLoop callback cycle
    drawLoop(0);
}
