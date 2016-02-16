var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var five = require("johnny-five");

// TODO: rearrange directory structure to make "public" folder
app.use(express.static('drawCanvas'));

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, './drawCanvas/drawcanvas.html'));
});

// Initialize johnny-five board
var board = new five.Board();

board.on("ready", function() {

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

    function activateMotors(stepsLeft, stepsRight) {
        // positive steps are extensions, negative steps are retractions.
        // XXX: this isn't DRY!
        // left stepper CCW to extend (stepsLeft==1), CW to retract (stepsLeft==-1)

        function eachStepper(stepperObj, stepsVal) {
            var dir = 0;

            if (stepsVal === 0) {
                // skip ahead. 0 steps isn't an error, necessarily
                return false;
            }

            // determine the direction from the sign of the stepsVal
            if (stepsVal > 0) {
                // extend if positive
                dir = stepperObj.extend_dir;
            } else {
                // retract is negative
                dir = stepperObj.retract_dir;
            }

            stepperObj.direction(dir).step(Math.abs(stepsVal), function(){
                console.log(stepperObj.name + " " + stepsVal);
            });
        }
        eachStepper(stepperLeft, stepsLeft);
        eachStepper(stepperRight, stepsRight);
    }

    io.on('connection', function (socket) {
        // Single steps
        socket.on('step', function (data, callback) {
            // TODO: check that stepsLeft & stepsRight attributes exist in data
            if((data.stepsLeft !== 0 && Math.abs(data.stepsLeft) !== 1 ) ||
            (data.stepsRight !== 0 && Math.abs(data.stepsRight) !== 1)) {
                console.log("WARNING: Bad single-step values. Skipping.");
            } else {
                // console.log(data);
                activateMotors(data.stepsLeft, data.stepsRight);

                // It's good, let the <canvas> make the virtual steps
                callback({'ok': true, 'data': data});
            }
        });

        // straight line
        socket.on('line', function (data, callback) {

            console.log(data);

            activateMotors(data.leftDelta, data.rightDelta);

            // TODO: validate
            // It's good, let the <canvas> make the virtual steps
            callback({'ok': true, 'data': data});
        });
    });

// Inject into repl for debugging
    this.repl.inject({
        stepperLeft: stepperLeft,
        stepperRight: stepperRight,
        activateMotors: activateMotors
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
