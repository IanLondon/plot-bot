// make lodash available globally
global._ = require('lodash');

var font_tools = require('./lib/font_tools.js');
var canvas_model = require('./lib/canvas_model.js');
var svg_tools = require('./lib/svg_tools.js');

console.log('hello from browserify');

document.getElementById('fileinput').addEventListener('change', function(evt){
    //Retrieve the first (and only!) File from the FileList object
    //and send it along to be drawn
    var file = evt.target.files[0];
    if (file) {
        svg_tools.drawSVGFromFile(file);
    } else {
        alert("Failed to load file");
    }
}, false);


// DEBUG: make browserified npm modules accessible in browser console's namespace
global.inject = {
    xml2js: require('xml2js'),
    xpath: require('xml2js-xpath'),
    parse_svg: require('svg-path-parser'),
    font_tools: font_tools,
    canvas_model: canvas_model,
    svg_tools: svg_tools,
    bezier: require('./lib/bezier.js'),
};
