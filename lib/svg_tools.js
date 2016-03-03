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
        } else if (cmds[i].type !== 'Z'){
            console.warn('Unsupported command code, "' + cmds[i].type + '"ignoring command.');
        }
    }
    return points;
}

function autoTranslate(points, settings) {
    // autoTranslate: slide the image to top left corner, or as close as the margin
    var autotranslate_margin = settings.autotranslate_margin || 0;
    var bounds = canvas_model.getBoundingBox(points);
    points = points.map(function(p){
        p.x = p.x - bounds.x0 + autotranslate_margin;
        p.y = p.y - bounds.y0 + autotranslate_margin;
        return p;
    });
    // DEBUG: DELETE
    bounds = canvas_model.getBoundingBox(points);
    console.log('bounds after autotranslate: ', bounds);

    return points;
}

function autoScale(points, settings) {
    // autoScale: scale the points so they fill the canvas

    // first do autoTranslate
    // the autoScale margin overrides the autoTranslate margin.
    var scale_margin = settings.autoscale_margin || 0;
    points = autoTranslate(points, {'autotranslate_margin':scale_margin});
    var bounds = canvas_model.getBoundingBox(points);

    var given_width = bounds.x - bounds.x0;
    var given_height = bounds.y - bounds.y0;

    var given_aspect = given_height/given_width;
    var max_width = bounds.CANVAS_WIDTH - scale_margin*2;
    var max_height = bounds.CANVAS_HEIGHT - scale_margin*2;
    var max_aspect = max_height/max_width;

    var scaleFactor;

    if (given_aspect <= max_aspect) {
        // given rectangle size is shorter & broader
        // (or the same)
        // so give it the maximum width
        scaleFactor = max_width/given_width;
    } else {
        // given rect is taller and skinnier
        // so give it max height
        scaleFactor = max_height/given_height;
    }
    console.log('scaleFactor: ', scaleFactor);
    points = points.map(function(p){
        p.x = ((p.x-bounds.x0) * scaleFactor) + bounds.x0;
        p.y = ((p.y-bounds.y0) * scaleFactor) + bounds.y0;
        return p;
    });
    // DEBUG: DELETE
    bounds = canvas_model.getBoundingBox(points);
    console.log('bounds after autoscale: ', bounds);

    return points;
}

function drawSVGFromFile(file, settings) {
    // get the file's contents and do basic validation
    // file should be a File object, eg from evt.target.files[0] on an <input> emitter
    // settings is an object that represents GUI settings
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
            console.log('settings:');
            console.log(settings);
            // TODO: validate commands here!
            if (validateCommands(cmds)){
                var points = svgToPoints(cmds);
                console.log('initial bounds: ', canvas_model.getBoundingBox(points));

                if (settings.autoscale) {
                    points = autoScale(points, settings);
                } else if (settings.autotranslate) {
                    // autoScale already translates, so don't do it again
                    points = autoTranslate(points, settings);
                }

                if (!canvas_model.withinBounds(canvas_model.getBoundingBox(points))) {
                    // SVG has points out of bounds
                    alert("Error: SVG has points out of the drawing area bounds. Try enabling autoscale or modifying the SVG.");
                    // give up
                    return;
                }

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
    // returns true if all commands are valid, false if any are not valid.
    var valid_commands = ['M','L','Q','C','Z'];
    var unsupported_cmd_count = {};

    // Check each command to see if it's in the valid_commands list
    // If it's not, add it to the count of unsupported commands
    _.forEach(cmds, function(cmd){
        if (valid_commands.indexOf(cmd.type)===-1) {
            if (unsupported_cmd_count[cmd.type]) {
                unsupported_cmd_count[cmd.type] += 1;
            } else {
                unsupported_cmd_count[cmd.type] = 1;
            }
        }
    });

    if (_.size(unsupported_cmd_count) !== 0) {
        // log unsupported commands to console
        console.warn('Got unsupported commands from SVG: ', unsupported_cmd_count);
        return false;
    }

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
