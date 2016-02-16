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
            // It's good, let the <canvas> make the virtual steps
            callback({'ok': true, 'data': data});
        }
      });
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
