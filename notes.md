In real life, the board's drawing area is described in Cartesian coordinates. The robot's drawing tool (marker, pencil, etc) shouldn't leave the defined drawing area! This has to be enforced by the server.

Drawing is usually done in Cartesian coordinates, though bipolar-native-coordinate drawing is possible.

The motors are commanded by # steps, so you can only communicate bipolar stepDeltas to the stepper motors.

***

The drawing area might vary from drawing to drawing. Eg, we might want only a 8.5"x11" piece of paper taped to the whiteboard to be drawn on. For simplicity, it should be defined as a rectangle with the base parallel to the imaginary line between the left and right pulleys (no funny shapes supported!).

~~There is no margin in the computed drawing area. The edges will be rough because the bipolar coordinates give you jagged edges. So if you want to allow a margin, just make your drawing area _smaller_ than your paper/whiteboard/etc.~~

The starting position won't always be at the "origin" - the origin might not even be accessible in the bounds of the currently defined drawing area! I guess we could define the origin where the cursor is exactly at the top left pulley: the left string is fully retracted, and the length of the right string equals the distance between the pulleys. IRL the gondola would smash into the left pulley in this position! The origin is just a theoretical place, not one you actually bring the drawing tool to.

***

The "canvas" is what I'm calling the browser client. It refers to the JS code running in the client browser, interacting with the server using the socket.io interface.

The server needs to know what bipolar stepDelta to use to command the motors, and needs to make sure the new position is within the bounds of the defined drawing area. The server holds the present position of the robot's cursor as `plotBot.stepDelta`.

Cartesian coordinates only concern the drawing area, so (x,y) = (0,0) can correspond to the top left corner of the drawing area.

If we simplify and drop native bipolar coordinate drawing support, then the client/canvas only needs to know the Cartesian coordinates within the drawing area rectangle. The server can handle the conversion to bipolar and the drawing area bounds checking by itself.

The client/canvas holds the present position of the robot's cursor as `virtualBot.cursorPos`.

The client also has to remember to scale the "true" relative Cartesian coordinates to the canvas pixel size.

***

**Cartesian coordinates** are measured from the drawing area origin (top left corner)

**Bipolar coordinates** are measured as a delta of stepper motor steps relative to the position that puts the gondola at the top left pulley.

***

# SVG

SVG files are XML, and we only care about the `<path d="SVG commands section">`

Watch out for transform() and translate() commands in the SVG `<g>` parents of a `<path>`! This can happen when you move a group around in Inkscape. Don't manipulate groups. Only manipulate points.

***Stipplegen can give crazy page sizes & shapes... why?***

Evil Mad Scientist's [Stipplegen](http://wiki.evilmadscientist.com/Stipplegen) outputs Traveling Salesman Problem (TSP) drawing path which is all straight lines: the SVG path is of the form

    M
    x0 y0
    x1 y1
    ...
    x_last y_last

with no commas, just newlines and spaces.

In contrast, an Inkscape pen tool drawing has a bunch of different commands, including Beziers and possible other things like ellipses. A very simple path might look like this (no newlines, uses commas and spaces)

```
"m 97.142857,138.07647 c 0,0 262.857143,-57.142859 265.714283,128.57143 2.85715,185.71428 120,-102.85715 120,-102.85715"
```

[svg-path-parser](https://github.com/hughsk/svg-path-parser) parses commands like `c 0,0 22,22` nicely.

You can force Inkscape to output only absolute paths by going to `File->Inkscape Preferences->SVG output` and un-checking the box next to `Allow relative coordinates`.


***

# TODO
* ~~Backup the old files just to be safe, then delete all the commented out old code~~
* ~~Move all the bipolar coordinate functions in robotDrawModel.js to server.js and/or plotbot.js -- the client/canvas should only keep track of cartesian coordinates for now~~
* ~~The client should take drawing area dimensions from the server upon websocket connection, and be instructed where to draw Cartesian lines from the server.~~
* ~~The server should represent the drawing area: width, height, displacement from robot origin. Also should represent step length (in mm) and pulley-to-pulley distance.~~
* ~~Modify fontTest.js to work with the new setup.~~
* ~~Fix the weird line thickening glitch - for some reason all old lines get stroked as drawing progresses.~~
* ~~Make the canvas scaling work correctly. Also, the canvas scale should be used to multiply the Cartesian coordinates when you make commands - otherwise you're doing a 1:1 pixel:Cartesian ratio, which would require a roughly 1220x2438 pixel canvas for the 4"x8" whiteboard!~~
* ~~Make activateMotors set the new stepDelta itself - it should be a comprehensive function. You might want to break it up into smaller functions -- but only call one function per movement command. Work it out.~~
* ~~Make activateMotors scale the velocity of the steppers so the "slow" one is at max speed and the "fast" one is scaled down -- they should complete at the same time, or else you get weird L-shaped lines when their # of steps are unequal and one finished first.~~
* ~~Fix fontTest.js (and rename it, no longer a test!)~~
* When you send a 'line' event to the server while the robot is already moving, it interrupts the movement and (the client, at least) loses track of its position. Don't let the client do that. ??? Deny overlapping requests and have the client requeue itself. ???
* A long `drawStraightLine` will let the line curve following bipolar space. If you manually chunk it into smaller segments, the drawn line will be straighter. Make drawStraightLine do this automatically using a plotbot.js-defined Plotbot.MAX_SEGMENT_LENGTH property. (Maybe rename drawStraightLine to moveRobotTo or something, and call moveRobot for each line segment, from a new fn called drawStraightLine)
* Make some kind of script to automate https://github.com/hughsk/svg-path-parser install and browserify workflow. For now, just include the browserify-bundled file in your repo...

## ~~SVG TODO~~
* After the browserify refactor:

```
// drawSVG looks for .type, but svg-path-parser uses .command,
// they're the same so just convert the name
cmds = inject.parse_svg(svgInject.svg_cmd_text).map(function(o){o.type = o.code; return o;});
inject.svg_tools.drawSVG(cmds)
```
* ~~A function should open up a file dialog and open a .svg file. Then, extract the `<path>`'s `d` attribute and send that to the parser. -- [xml2js](https://www.npmjs.com/package/xml2js) and [xml2js-xpath](https://www.npmjs.com/package/xml2js-xpath).~~

* ^ `getSVGPathFromText` does this, ~~but xpath uses a callback so I can't return it. I guess everything can use callbacks... so then the initial call will look like:~~

```
getSVGPathFromText(contents, function(commands){
    checkSVGCommands(commands, function(good_commands){
        checkBoundingBox(good_commands, function(bounded_commands) {
            finallyDrawTheThingOMG(bounded_commands);
        })
    })
});
```

~~**^^^No, just do all the functions in order. You don't need to return anything at the end!**~~

* ~~As soon as you have a parsed SVG array, **check for unsupported commands** and stop with an explicit error if the command isn't supported~~

* ~~A function should evaluate an SVG and **determine the bounding box before trying to draw it**. With beziers in the mix, calculating the bounding box is non-trivial -- but you can **convert it to a series of points** before drawing it with the functions you already have!~~

## SVG IMPORTS WORK! What's next?

* **Draw the eye SVG on the board! Use a tablecloth or something to protect the wall and floor from wandering markers, just in case.**
* Implement GUI to change the app_settings (currently)
* GUI to change Plotbot settings (eg drawing area size/pos, initial string length)
* Try connecting with smartphone and using touchscreen to draw!
* **Measure strings lengths across stepping range** and figure out if it's constant or not. What is causing the remaining distortion?
* Convert relative paths to absolute (it's not too hard. See http://www.sitepoint.com/closer-look-svg-path-data/ to understand what "relative" refers to)
* While it's nice that `opentype` outputs an array of command objects, they don't have all the info that `svg-path-parser` provides. Rewrite the SVG command functions to be `svg-path-parser` native, and for type, use `opentype`'s SVG string functionality (then send that string to `svg-path-parser`).
* What SVG path commands am I missing? Which of those do you get with the pen tool?
* **Start a static blog to explain how to build and operate the robot, and the build process!**
* Pause/play button (on the client side, prevent new file load & prevent clicking to draw when actively drawing)
* Convenient interface to tell you where to place the marker (string length coordinates) for the first point on the list of points. Eg for smiley, it starts near the bottom. The current model makes you set the start point in plotbot.js settings, and you'd have to go in and calculate the first point yourself. Alternatively: position the gondola at the default origin point, b/c it's more convenient to always start at the same point across drawings. Then the browser app tells you to cap the marker, it moves the marker to the first point, and tells you to uncap the marker. Boom!
* Quick preview (without moving the bot, without slowly tracing - use the <canvas>'s build-in SVG stuff?)
* Alternative cross-hatching, etc
* Be able to click many times and let the robot catch up to you. (Right now it interrupts & confuses the server!)
* Support multiple `<path>`s? Are they in any kind of order?
* Add GUI tools for text
* Time elapsed
* Time estimate with given settings (and other fun stats used in deriving that, eg total path length)
