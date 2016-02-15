# plot-bot
A v-plotter / Polargraph-type drawing robot actuated with johnny-five and with simulation tools using HTML5 &lt;canvas>

Right now it is only a simple vector-drawing-in-discrete-bipolar-coordinates simulator of how the bot will work.

`drawCanvas/drawcanvas.html` now shows an example of using the `opentype.js` module to simulate drawing the outline of arbitrary text in a solid TrueType font (see `drawCanvas/fontTest.js`).

You can draw straight lines by clicking and dragging on the canvas (line will start on mousedown and ends on mouseup), or by entering commands in the console like:

    plotBot.COLOR = "rgba(255,0,0,0.25)";
    moveRobotTo(getBipolarCoords(100,200));
    drawStraightLine(getBipolarCoords(100,100));

## step()
The fundamental stepping operation is `step(stepsLeft, stepsRight)`, where the arguments can be -1, 0, or +1. Eg `step(-1,1)` will retract the left stepper motor by one step and extend the right stepper motor by one step.

You can manually extend/retract the stepper motors by pressing the following keys when the canvas is active:
<table>
<tr>
    <th>Motor</th>
    <th>Extend</th>
    <th>Retract</th>
</tr>
<tr>
    <td>Left</td>
    <td>f</td>
    <td>d</td>
</tr>
<tr>
    <td>Right</td>
    <td>j</td>
    <td>k</td>
</tr>
</table>

### TODO: connect step() to johnny-five, so the Arduino actually moves the stepper motor!
