# plot-bot
A v-plotter / Polargraph-type drawing robot actuated with johnny-five and with simulation tools using HTML5 &lt;canvas>

Right now it is only a simple vector-drawing-in-discrete-bipolar-coordinates simulator of how the bot will work.

You can draw straight lines by clicking and dragging on the canvas (line will start on mousedown and ends on mouseup), or by entering commands in the console like:

    plotBot.COLOR = "rgba(255,0,0,0.25)";
    moveRobotTo(getBipolarCoords(100,200));
