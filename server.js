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

    var stepperLeft = new five.Stepper({
        type: five.Stepper.TYPE.DRIVER,
        stepsPerRev: 48,
        pins: {
            step: 2,
            dir: 3
        }
    });

    var stepperRight = new five.Stepper({
        type: five.Stepper.TYPE.DRIVER,
        stepsPerRev: 48,
        pins: {
            step: 10,
            dir: 11
        }
    });

    io.on('connection', function (socket) {
        socket.on('step', function (data, callback) {
            // TODO: check that stepsLeft & stepsRight attributes exist in data
            if((data.stepsLeft !== 0 && Math.abs(data.stepsLeft) !== 1 ) ||
            (data.stepsRight !== 0 && Math.abs(data.stepsRight) !== 1)) {
                console.log("WARNING: Bad step values. Skipping.");
        } else {
            console.log(data);

            // XXX: this isn't DRY!
            // left stepper CW to extend (stepsLeft==1), CCW to retract (stepsLeft==-1)
            if (Math.abs(data.stepsLeft) == 1) {
                if (data.stepsLeft == 1) {
                    // extend
                    var leftDir = five.Stepper.DIRECTION.CW;
                } else {
                    // retract
                    var leftDir = five.Stepper.DIRECTION.CCW;
                }
                stepperLeft.direction(leftDir).step(data.stepsLeft);
            }

            // right stepper does the opposite. Extend
            if (Math.abs(data.stepsRight) == 1) {
                if (data.stepsRight == 1) {
                    // extend
                    var rightDir = five.Stepper.DIRECTION.CCW;
                } else {
                    // retract
                    var rightDir = five.Stepper.DIRECTION.CW;
                }
                stepperLeft.direction(rightDir).step(data.stepsRight);
            }

            // It's good, let the <canvas> make the virtual steps
            callback({'ok': true, 'data': data});
        }
      });
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
