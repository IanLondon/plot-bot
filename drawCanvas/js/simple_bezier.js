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

function spatialObjType(sObj) {
    // Determines a spatial object's type using its keys
    // XXX: doesn't warn on incomplete objects, eg (x, y, x0) or w/e
    if (sObj.x !== undefined && sObj.y !== undefined) {
        if (sObj.x0 !== undefined && sObj.y0 !== undefined){
            if (sObj.x1 !== undefined && sObj.y1 !== undefined) {
                if(sObj.x2 !== undefined && sObj.y2 !== undefined) {
                    return 'cubicBezier'; // (x0, y0, x, y, x1, y1, x2, y2)
                }
                return 'quadBezier'; // (x0, y0, x, y, x1, y1)
            }
            return 'line'; // (x0, y0, x, y)
        }
        return 'point'; // (x, y)
    }
    return 'invalid';
}

function sObjToPoint(sObj, t) {
    // sObj should be spatial object
    // Returns an (x,y) point that corresponds to the given t value
    // using weighted basis function for Bezier curves
    // See http://pomax.github.io/bezierinfo/#control

    // also lets points pass-thru
    // and for straight lines, uses t as % of length
    if (t<0 || t>1) {
        throw new Error("Invalid t value. t should be in [0, 1].");
    }

    if (spatialObjType(sObj) == 'point') {
        // points just pass through.
        console.log("DEBUG: sObjToPoint got a point");
        return(sObj);
    }

    if (spatialObjType(sObj) == 'line') {
        return {
            x: sObj.x0 + t*(sObj.x-sObj.x0),
            y: sObj.y0 + t*(sObj.y-sObj.y0),
        };
    }

    var t2 = t * t;
    var mt = 1-t;
    var mt2 = mt * mt;

    if (spatialObjType(sObj) == 'quadBezier') {
        return {
            x: sObj.x0*mt2 + sObj.x*2*mt*t + sObj.x1*t2,
            y: sObj.y0*mt2 + sObj.y*2*mt*t + sObj.y1*t2,
        };
    }
    if (spatialObjType(sObj) == 'cubicBezier') {
        var t3 = t2 * t;
        var mt3 = mt2 * mt;
        return {
            x: sObj.x0*mt3 + 3*sObj.x*mt2*t + 3*sObj.x1*mt*t2 + sObj.x2*t3,
            y: sObj.y0*mt3 + 3*sObj.y*mt2*t + 3*sObj.y1*mt*t2 + sObj.y2*t3,
        };
    }

    throw new Error("Invalid bezier parameters! Got: " + spatialObjType(sObj) + ' -- ', sObj);
}

function euclidianDist(pointA, pointB) {
    // Euclidian distance between two points

    if (spatialObjType(pointA) !== 'point' || spatialObjType(pointB) !== 'point') {
        throw new Error("euclidianDist got a non-point object.");
    }

    if (pointA.x < 0 || pointA.y < 0 || pointB.x < 0 || pointB.y < 0) {
        throw new Error("Negative coordinate values not supported.");
    }

    return Math.sqrt(Math.pow((pointB.x - pointA.x), 2) + Math.pow((pointB.y - pointA.y), 2));
}

function sObjSubsection(sObj, subsectionCount) {
    // Returns the total length of the segments, and the points (there are subsectionCount+1 points)
    // For a line, simply splits it up into subsections.
    // For Bezier curves, measures the curve by summing Euclidian distances between points
    // Note: subsectionCount should be higher for more complex or "curvy" curves
    // WARNING: for curves, the line segments won't have equal lengths!

    // Use default if unspecified
    // TODO: should be a plotbot property
    // or even better, auto-determined somehow at least loosely!
    var DEFAULT_SUBSECTION_COUNT = 12;
    subsectionCount = typeof subsectionCount !== 'undefined' ? subsectionCount : DEFAULT_SUBSECTION_COUNT;

    if (subsectionCount <= 0) {
        throw new Error("subsection count must be greater than 0");
    }


    var total_len = 0;
    var points = [];

    // iterate through all the points of the straight-line subsections
    for (var i=0; i<=subsectionCount; i++) {
        points.push(sObjToPoint(sObj, i/subsectionCount));
        if (i>0) {
            // add length between previous point and current point.
            total_len += euclidianDist(points[i-1], points[i]);
        }
    }

    return {'len':total_len, 'points':points};
}

function drawPoints(points) {
    console.log('beginning drawPoints');
    // TODO: make a version compatible with both points from bezier and points from opentype.js
    var DELAY_BTW_COMMANDS = 50; //TODO: this should be a plotbot property...
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
