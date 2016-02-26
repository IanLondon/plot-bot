var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var five = require("johnny-five");
var plotbot = require("./plotbot.js");

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
          debug: false,
          repl: false
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
        }
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
        }
    });
    stepperRight.extend_dir = five.Stepper.DIRECTION.CW;
    stepperRight.retract_dir = five.Stepper.DIRECTION.CCW;
    stepperRight.name = 'right';

    function activateMotors(stepsLeft, stepsRight, callback) {
        // positive steps are extensions, negative steps are retractions.
        function eachStepper(stepperObj, stepsVal, doneSteppingCallback) {
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

            stepperObj.direction(dir).step(Math.abs(stepsVal), function(){
                console.log(stepperObj.name + " " + stepsVal + ' completed.');
                doneSteppingCallback();
            });
        }

        if (Math.abs(stepsLeft) > Math.abs(stepsRight)) {
            // left has more steps, assume it's the slower movement
            // XXX: Acceleration of both steppers must be same for this assumption to hold
            eachStepper(stepperLeft, stepsLeft, callback);
            eachStepper(stepperRight, stepsRight, function(){
                console.log('right is done stepping');
            });
        } else {
            // right is the slower movement (or they finish at the same time)
            eachStepper(stepperLeft, stepsLeft, function(){
                console.log('left is done stepping');
            });
            eachStepper(stepperRight, stepsRight, callback);
        }
    }

    io.on('connection', function (socket) {
        console.log('io connection');
        // Single steps
        socket.on('step', function (data, socket_callback) {
            console.log('got step event from browser', data);
            // TODO: check that stepsLeft & stepsRight attributes exist in data
            if((data.stepsLeft !== 0 && Math.abs(data.stepsLeft) !== 1 ) ||
            (data.stepsRight !== 0 && Math.abs(data.stepsRight) !== 1)) {
                console.log("WARNING: Bad single-step values. Skipping.");
            } else {
                activateMotors(data.stepsLeft, data.stepsRight, function() {
                    // It's good, let the <canvas> make the virtual steps
                    // once the steppers are done moving.
                    socket_callback({'ok': true, 'data': data});
                });

            }
        });

        // straight line
        socket.on('line', function (data, socket_callback) {

            console.log('drawing line with data: ');
            console.log(data);

            activateMotors(data.leftDelta, data.rightDelta, function() {
                // It's good, let the <canvas> make the virtual steps
                socket_callback({'ok': true, 'data': data});
            });
        });
    });

// // Inject into repl for debugging
//     this.repl.inject({
//         stepperLeft: stepperLeft,
//         stepperRight: stepperRight,
//         activateMotors: activateMotors
//     });
});

if (DEBUG) {
    board.emit('ready');
}

http.listen(3000, function(){
    console.log('listening on *:3000');
});
