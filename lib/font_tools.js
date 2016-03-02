var opentype = require('opentype.js');
var canvas_model = require('./canvas_model.js');
var svg_tools = require('./svg_tools');

function getTextPath(TextMgr, callback) {
    // Generate a text path specified by the TextMgr's properties and pass it to a callback
    opentype.load(TextMgr.FONT_PATH, function(err, font) {
        if (err) {
            throw new Error('Could not load font: ' + err);
        }
        // Construct a Path object containing the letter shapes of the given text.
        // The other parameters are x, y and fontSize.
        // Note that y is the position of the baseline.
        var path = font.getPath(TextMgr.text_to_draw, TextMgr.x0, TextMgr.y0, TextMgr.fontSize);
        callback(path);
    });
}

function showStroke(TextMgr) {
    // Show the stroke of the text in green, without drawing
    TextMgr.getTextPath(function(path) {
        path.fill = null;
        path.stroke = 'rgba(0,255,0,0.25)';
        path.draw(TextMgr.ctx);
    });
}

function drawTextPoints(TextMgr) {
    TextMgr.getTextPath(function(path){
        var cmds = path.commands;
        var points = [];
        // add all valid command coordinates (exclude the last cmd) to drawCoords
        for (var i = 0; i < cmds.length; i++) {
            if (cmds[i].type != 'Z') {
                points.push({'x':cmds[i].x, 'y':cmds[i].y});
            }
        }
        canvas_model.drawPoints(points);
    });
}

// Just a simple wrapper now
function drawText(TextMgr) {
    TextMgr.getTextPath(function(path){
        svg_tools.drawPoints(svgToPoints(path.commands));
    });
}

exports.font_manager = {
    // Defaults
    x0: 20,
    y0: 200,
    text_to_draw: 'Hello world!',
    fontSize: 40,
    ctx: document.getElementById('canvas1').getContext('2d'),
    FONT_PATH: 'fonts/candy_shop/Candy\ Shop\ Black.ttf',
    getTextPath: function(callback) {getTextPath(this, callback);},
    drawText: function() {drawText(this);},
    drawTextPoints: function() {drawTextPoints(this);},
    showStroke: function() {showStroke(this);},
};
