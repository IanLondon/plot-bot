var drawCoords = [];
var DELAY_BTW_COMMANDS = 500; // this might help avoid abrupt movements (eg acute angles)

var TextMgr = {
    x0: 100,
    y0: 100,
    text_to_draw: 'hi',
    fontSize: 50,
    ctx: undefined,
    path: undefined,
    FONT_PATH: 'fonts/candy_shop/Candy\ Shop\ Black.ttf',
};

function refreshFont() {
    opentype.load(TextMgr.FONT_PATH, function(err, font) {
        if (err) {
            throw new Error('Could not load font: ' + err);
        } else {
            // Use your font here.
            TextMgr.ctx = document.getElementById('canvas1').getContext('2d');
            // Construct a Path object containing the letter shapes of the given text.
            // The other parameters are x, y and fontSize.
            // Note that y is the position of the baseline.
            TextMgr.path = font.getPath(TextMgr.text_to_draw, TextMgr.x0, TextMgr.y0, TextMgr.fontSize);
            // If you just want to draw the text you can also use font.draw(ctx, text, x, y, fontSize).
        }
    });
}

// XXX: bad redo this all!!!
refreshFont();
// TODO: ahh!

function showStroke() {
    // Show the stroke of the text in green, without drawing
    TextMgr.path.fill = null;
    TextMgr.path.stroke = 'rgba(0,255,0,0.25)';
    TextMgr.path.draw(TextMgr.ctx);
}

function drawText() {
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

    var cmds = TextMgr.path.commands;
    // add all valid command coordinates (exclude the last cmd) to drawCoords
    for (i = 0; i < cmds.length; i++) {
        if (cmds[i].type != 'Z') {
            drawCoords.push({'x':cmds[i].x, 'y':cmds[i].y});
        }
    }

    // Start drawLoop callback cycle
    drawLoop(0);
}
