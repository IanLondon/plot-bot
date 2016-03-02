var xml2js = require('xml2js');
var xpath = require("xml2js-xpath");
// Using https://github.com/hughsk/svg-path-parser
var parse_svg = require('svg-path-parser');

// make browserified npm modules accessible in browser namespace
window.parse_svg = parse_svg;
window.xml2js = xml2js;
window.xpath = xpath;
