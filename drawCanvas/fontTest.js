console.log("running font drawing test!");

opentype.load('fonts/candy_shop/Candy\ Shop\ Black.ttf', function(err, font) {
    if (err) {
        alert('Could not load font: ' + err);
    } else {
        // Use your font here.
        var ctx = document.getElementById('canvas1').getContext('2d');
        // Construct a Path object containing the letter shapes of the given text.
        // The other parameters are x, y and fontSize.
        // Note that y is the position of the baseline.
        var path = font.getPath('hi there', 100, 250, 92);
        // If you just want to draw the text you can also use font.draw(ctx, text, x, y, fontSize).

        // DEBUG: show the stroke of the text
        show_stroke = false;
        if (show_stroke) {
            path.fill = null;
            path.stroke = 'black';
            path.draw(ctx);
        }
        cmds = path.commands

        // path.commands has x y coords, all except the last
        for (i = 0; i < cmds.length; i++) {
            if (cmds[i].type != 'Z') {
                moveRobotTo(getBipolarCoords(cmds[i].x,cmds[i].y));
            }
        }

    }
});
