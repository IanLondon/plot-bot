var TextMgr = {
    x0: 20,
    y0: 200,
    text_to_draw: 'Happy Birthday Sarah',
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

// TODO: OLD, DELETE
function drawTextRough() {
    var cmds = TextMgr.path.commands;
    var points = [];
    // add all valid command coordinates (exclude the last cmd) to drawCoords
    for (var i = 0; i < cmds.length; i++) {
        if (cmds[i].type != 'Z') {
            points.push({'x':cmds[i].x, 'y':cmds[i].y});
        }
    }
    // call simple_bezier function
    drawPoints(points);
}

function drawSVG(cmds) {
    var points = [];
    // XXX: the whole point of prev is to have a default prev (x,y) -- beziers & lines don't have x0,y0.
    // This shouldn't come into play, unless a command is missing, which is possible!
    var prev = {x:0, y:0}; // TODO: this should really use the current position of the plotbot!!! TODO!!
    var subPoints;

    // add all valid command coordinates (exclude the 'Z' cmd) to the points array
    for (var i = 0; i < cmds.length; i++) {
        if (cmds[i].type === 'M' || cmds[i].type === 'L') {
            // 'M' is move, 'L is straight line'
            // since the bot can't lift the pen, they're the same.
            // points.push({'x':cmds[i].x, 'y':cmds[i].y});
            points.push({x: cmds[i].x, y: cmds[i].y});
            // update the previous point
            prev = {x: cmds[i].x, y: cmds[i].y};
        } else if (cmds[i].type === 'Q' || cmds[i].type === 'C') {
            // 'Q' and 'C' are Quadratic or Cubic Bezier curve commands, respectively.
            //
            // Leave it up to sObjSubsection to determine if it's Quadratic or Cubic,
            // and to determine the number of subsections.
            //
            // Set the x0 and y0 with previous point, they aren't contained in the command.
            cmds[i].x0 = prev.x;
            cmds[i].y0 = prev.y;
            // Push the elements of the resulting array of points to the points array
            subPoints = sObjSubsection(cmds[i]).points;
            points = points.concat(subPoints); // TODO: this is slow op

            // update the previous point using the points array
            prev = {
                x: (points[points.length-1].x),
                y: (points[points.length-1].y),
            };
        }
    }
    // call simple_bezier function
    drawPoints(points);
    console.log('points: ', points);
}

// Just a simple wrapper now
function drawText() {
    drawSVG(TextMgr.path.commands.slice());
}
