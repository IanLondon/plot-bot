In real life, the board's drawing area is described in Cartesian coordinates. The robot's drawing tool (marker, pencil, etc) shouldn't leave the defined drawing area! This has to be enforced by the server.

Drawing is usually done in Cartesian coordinates, though bipolar-native-coordinate drawing is possible.

The motors are commanded by # steps, so you can only communicate bipolar stepDeltas to the stepper motors.

***

The drawing area might vary from drawing to drawing. Eg, we might want only a 8.5"x11" piece of paper taped to the whiteboard to be drawn on. For simplicity, it should be defined as a rectangle with the base parallel to the imaginary line between the left and right pulleys (no funny shapes supported!).

There is no margin in the computed drawing area. The edges will be rough because the bipolar coordinates give you jagged edges. So if you want to allow a margin, just make your drawing area _smaller_ than your paper/whiteboard/etc.

The starting position won't always be at the "origin" - the origin might not even be accessible in the bounds of the currently defined drawing area! I guess we could define the origin where the cursor is exactly at the top left pulley: the left string is fully retracted, and the length of the right string equals the distance between the pulleys. IRL the gondola would smash into the left pulley in this position! The origin is just a theoretical place, not one you actually bring the drawing tool to.

***

The "canvas" is what I'm calling the browser client. It refers to the JS code running in the client browser, interacting with the server using the socket.io interface.

The server needs to know what bipolar stepDelta to use to command the motors, and needs to make sure the new position is within the bounds of the defined drawing area. The server holds the present position of the robot's cursor as `plotBot.stepDelta`.

Cartesian coordinates only concern the drawing area, so (x,y) = (0,0) can correspond to the top left corner of the drawing area.

If we simplify and drop native bipolar coordinate drawing support, then the client/canvas only needs to know the Cartesian coordinates within the drawing area rectangle. The server can handle the conversion to bipolar and the drawing area bounds checking by itself.

The client/canvas holds the present position of the robot's cursor as `plotBot.currentCartesian`.

***

**Cartesian coordinates** are measured from the drawing area origin (top left corner)

**Bipolar coordinates** are measured as a delta of stepper motor steps relative to the position that puts the gondola at the top left pulley.

***

# TODO
* ~~Backup the old files just to be safe, then delete all the commented out old code~~
* Move all the bipolar coordinate functions in robotDrawModel.js to server.js and/or plotbot.js -- the client/canvas should only keep track of cartesian coordinates for now
* The client should take drawing area dimensions from the server upon websocket connection, and be instructed where to draw Cartesian lines from the server.
* The server should represent the drawing area: width, height, displacement from robot origin. Also should represent step length (in mm) and pulley-to-pulley distance.
