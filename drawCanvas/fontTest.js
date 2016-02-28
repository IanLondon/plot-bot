function drawText(text_to_draw, x0, y0, fontSize) {

    var drawCoords = [];
    var DELAY_BTW_COMMANDS = 500; // this might help avoid abrupt movements (eg acute angles)

    function drawLoop(drawIndex) {
        if (drawIndex >= drawCoords.length) {
            // break out of callback loop
            console.log('exiting drawLoop');
            return false;
        }
        var nextCoords = [drawCoords[drawIndex].x, drawCoords[drawIndex].y];
        console.log('nextCoords (relative cartesian):');
        console.log(nextCoords);
        drawStraightLine(nextCoords[0], nextCoords[1], function(){
            setTimeout(function(){
                drawLoop(drawIndex+1);
            }, DELAY_BTW_COMMANDS);
        });
    }

    opentype.load('fonts/candy_shop/Candy\ Shop\ Black.ttf', function(err, font) {
        if (err) {
            alert('Could not load font: ' + err);
        } else {
            // Use your font here.
            var ctx = document.getElementById('canvas1').getContext('2d');
            // Construct a Path object containing the letter shapes of the given text.
            // The other parameters are x, y and fontSize.
            // Note that y is the position of the baseline.
            var path = font.getPath(text_to_draw, x0, y0, fontSize);
            // If you just want to draw the text you can also use font.draw(ctx, text, x, y, fontSize).

            // DEBUG: show the stroke of the text in green
            show_stroke = true;
            if (show_stroke) {
                path.fill = null;
                path.stroke = 'rgba(0,255,0,0.25)';
                path.draw(ctx);
            }
            cmds = path.commands;

            // add all valid command coordinates (exclude the last cmd) to drawCoords
            for (i = 0; i < cmds.length; i++) {
                if (cmds[i].type != 'Z') {
                    drawCoords.push({'x':cmds[i].x, 'y':cmds[i].y});
                }
            }

            // Start drawLoop callback cycle
            drawLoop(0);
        }
    });
}
