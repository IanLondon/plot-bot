var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var five = require("johnny-five");
var plotbot = require("./plotbot.js");

var MAX_RPM = 60; //max RPM for stepper motors

// TODO: rearrange directory structure to make "public" folder
app.use(express.static('drawCanvas'));

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, './drawCanvas/drawcanvas.html'));
});

// Handle debug mode
var DEBUG = false;

if (process.argv.indexOf('debug') != -1) {
    DEBUG = true;
}

if (DEBUG) {
    // use MockFirmata
    console.log("DEBUG mode. Using mock-firmata");
    var mocks = require('mock-firmata');
    var MockFirmata = mocks.Firmata;

    var board = new five.Board({
        io: new MockFirmata({
            // pins: [
            //   {
            //     supportedModes: [2,3,8,10,11]
            //   }
            // ]
          }),
          debug: true,
          repl: true
    });

    // monkey patch Stepper.step so that callbacks work in mock mode
    var STEPPER_MOCK_DELAY = 250;
    five.Stepper.prototype.step = function(steps, callback) {
        setTimeout(callback, STEPPER_MOCK_DELAY);
    };
} else {
    // Use a real, non-mock johnny-five board
    var board = new five.Board();
}

function updateClient(socket) {
    var curr_coords = plotbot.getCartesian(plotbot.stepDelta, 'rel');
    socket.emit('update',
    {
        'coords': [curr_coords.x, curr_coords.y],
        'canvasWidth': plotbot.DRAWING_AREA_WIDTH,
        'canvasHeight': plotbot.DRAWING_AREA_HEIGHT,
    });
}


board.on("ready", function() {
    console.log('board ready.');
    // Initialize stepper motors

    // WIRING:
    // Both steppers AABB is (from left to right)
    // brown, black, orange, yellow.
    //
    // Pot dialed min (cw) to lowest setting.
    //
    // M1 & M2 all grounded for full-step mode.
    //
    // The direction depends on your setup, you may have to swap extend_dir & retract_dir
    var stepperLeft = new five.Stepper({
        type: five.Stepper.TYPE.DRIVER,
        stepsPerRev: 48,
        pins: {
            step: 2,
            dir: 3
        },
        rpm: MAX_RPM,
    });
    stepperLeft.extend_dir = five.Stepper.DIRECTION.CCW;
    stepperLeft.retract_dir = five.Stepper.DIRECTION.CW;
    stepperLeft.name = 'left';

    var stepperRight = new five.Stepper({
        type: five.Stepper.TYPE.DRIVER,
        stepsPerRev: 48,
        pins: {
            step: 10,
            dir: 11
        },
        rpm: MAX_RPM,

    });
    stepperRight.extend_dir = five.Stepper.DIRECTION.CW;
    stepperRight.retract_dir = five.Stepper.DIRECTION.CCW;
    stepperRight.name = 'right';

    function activateMotors(stepsLeft, stepsRight, callback) {
        // positive steps are extensions, negative steps are retractions.
        function eachStepper(stepperObj, stepsVal, rpms, doneSteppingCallback) {
            if (typeof rpms != 'number') {
                throw new Error("rpms must be a number");
            }

            var dir = 0;

            if (stepsVal === 0) {
                // skip ahead. 0 steps isn't an error, necessarily
                console.log('Zero stepsVal, for stepper "' + stepperObj.name + '", skipping.');
                return false;
            }

            // determine the direction from the sign of the stepsVal
            if (stepsVal > 0) {
                // extend if positive
                dir = stepperObj.extend_dir;
            } else {
                // retract if negative
                dir = stepperObj.retract_dir;
            }


            stepperObj.direction(dir).rpm(rpms).step(Math.abs(stepsVal), function(){
                console.log(stepperObj.name + " " + stepsVal + ' completed. RPM: ' + rpms);
                doneSteppingCallback();
            });
        }

        var slow_rpms;

        if (Math.abs(stepsLeft) > Math.abs(stepsRight)) {
            // left has more steps, it's the "longer" movement
            eachStepper(stepperLeft, stepsLeft, MAX_RPM, callback);
            slow_rpms = MAX_RPM * Math.abs(stepsRight/stepsLeft);
            eachStepper(stepperRight, stepsRight, slow_rpms, function(){
                console.log('right is done stepping');
            });
        } else {
            // right is the "longer" movement (or they finish at the same time)
            slow_rpms = MAX_RPM * Math.abs(stepsLeft/stepsRight);
            eachStepper(stepperLeft, stepsLeft, slow_rpms, function(){
                console.log('left is done stepping');
            });
            eachStepper(stepperRight, stepsRight, MAX_RPM, callback);
        }

        // finally, update the stepDelta
        plotbot.stepDelta[0] += stepsLeft;
        plotbot.stepDelta[1] += stepsRight;
    }

    io.on('connection', function (socket) {
        console.log('io connection');
        // initial update to give cursor position + canvas width & height
        updateClient(socket);

        // Single steps
        socket.on('step', function (data, socket_callback) {
            console.log('got step event from browser', data);
            console.log("WARNING: 'step' event does not validate the destination.");
            // TODO: check that stepsLeft & stepsRight attributes exist in data
            if((data.stepsLeft !== 0 && Math.abs(data.stepsLeft) !== 1 ) ||
            (data.stepsRight !== 0 && Math.abs(data.stepsRight) !== 1)) {
                console.log("WARNING: Bad single-step values. Skipping.");
                socket_callback({'status':'bad step values'});
            } else {
                activateMotors(data.stepsLeft, data.stepsRight, function() {
                    // It's good, let the client/canvas make the virtual steps
                    dest_cartesian = plotbot.getCartesian(plotbot.stepDelta, 'rel');
                    socket_callback({'status': 'ok', 'dest': dest_cartesian});
                });
            }
        });

        // straight line
        socket.on('line', function (data, socket_callback) {
            console.log('drawing line with data: ');
            console.log(data);
            // Calculate & validate step deltas
            var destDelta = plotbot.getBipolar(data.x, data.y, 'rel');
            var leftDelta = destDelta[0] - plotbot.stepDelta[0];
            var rightDelta = destDelta[1] - plotbot.stepDelta[1];

            if (plotbot.validateStepDelta(destDelta)) {
                activateMotors(leftDelta, rightDelta, function() {
                    // It's good, let the client/canvas make the virtual steps
                    dest_cartesian = plotbot.getCartesian(plotbot.stepDelta, 'rel');
                    socket_callback({'status': 'ok', 'dest': dest_cartesian});
                });
            } else {
                socket_callback({'status': 'invalid destination'});
            }

        });
    });

    // Inject into repl for debugging
    // TODO: (I can't get into the repl in mock-firmata...?)
    this.repl.inject({
        stepperLeft: stepperLeft,
        stepperRight: stepperRight,
        activateMotors: activateMotors,
        plotbot: plotbot,
    });
});

if (DEBUG) {
    board.emit('ready');
}

http.listen(3000, function(){
    console.log('listening on *:3000');
});
