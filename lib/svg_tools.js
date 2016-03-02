var xml2js = require('xml2js');
var xpath = require("xml2js-xpath");
var svg_path_parser = require('svg-path-parser');
var bezier = require('./bezier');
var canvas_model = require('./canvas_model.js');

function svgToPoints(cmds) {
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
            subPoints = bezier.sObjSubsection(cmds[i]).points;
            points = points.concat(subPoints); // TODO: this is slow op

            // update the previous point using the points array
            prev = {
                x: (points[points.length-1].x),
                y: (points[points.length-1].y),
            };
        }
    }
    return points;
}

function drawSVGFromFile(file) {
    // get the file's contents and do basic validation
    var r = new FileReader();
    r.onload = function(e) {
        var contents = e.target.result;

        if(file.type !== 'image/svg+xml') {
            console.warn("DEBUG: filetype doesn't seem to be 'image/svg+xml'. Trying anyway!");
        }

        console.log("Got the file.\n" +
            "name: " + file.name + "\n" +
            "type: " + file.type + "\n" +
            "size: " + file.size + " bytes\n" +
            "starts with: " + contents.substr(1, contents.indexOf("\n"))
        );

        getSVGPathFromText(contents, function(err, svg_cmd_text) {
            if (err) {
                console.warn('got err', err);
            }
            // The module svg-path-parser converts a text string of an SVG path's commands
            // to an object of commands almost compatible with svgToPoints.
            // The only difference is svgToPoints expects command labels as `.type`, whereas svg-path-parser
            // outputs the labels under `.code` -- so we need to simply copy the info in `.code` to `.type`
            var cmds = svg_path_parser(svg_cmd_text).map(function(o){o.type = o.code; return o;});
            console.log('got parsed SVG cmds');
            console.log(cmds);
            // TODO: validate commands here!
            if (validateCommands(cmds)){
                //convert to points with some new fn
                var points = svgToPoints(cmds);
                //TODO: getBoundingBox(points, ...height & width allowed). a canvas_model.js function.
                console.warn("getBoundingBox(points, ...height & width allowed). a canvas_model.js function.");

                canvas_model.drawPoints(points);
            } else {
                // validateCommands logs to console
                alert('Unsupported SVG operations. See console output for details.');
            }
        });
    };
    r.readAsText(file);
}

function validateCommands(cmds) {
    // check that the commands are valid for svgToPoints to use.
    console.warn("validateCommands not implemented yet, pretending that it's valid...");

    // log errors to console

    // return true or false at the end.
    return true;
}

function getSVGPathFromText(text_content, callback) {
    // gets the path content of a .svg file: "...<path g='...this good stuff here...'>"

    xml2js.parseString(text_content, function(err,result){
        if(err) {
            throw new Error(err);
        }

        var found_path = xpath.find(result, '//path');
        if (found_path.length !== 1) {
            throw new Error("Only supports SVG files with exactly 1 path element. Got " + found_path.length);
        }

        var svg_cmd_text = found_path[0].$.d;

        if (!svg_cmd_text) {
            throw new Error("No d attribute of SVG <path> found.");
        }

        // //XXX: DEBUG
        // global.svgInject = {};
        // global.svgInject.text_content = text_content;
        // global.svgInject.result = result;
        // global.svgInject.svg_cmd_text = svg_cmd_text;

        callback(err, svg_cmd_text);
    });
}

// All exports
exports.svgToPoints = svgToPoints;
exports.getSVGPathFromText = getSVGPathFromText;
exports.validateCommands = validateCommands;
exports.drawSVGFromFile = drawSVGFromFile;
