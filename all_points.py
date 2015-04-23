import numpy as np
import matplotlib.pyplot as plt

#plot all the points that can be reached, given the resolution of the string length.

#all values in mm

# 8'x4' board = 2438.4 mm x 1219.2 mm
# but hell let's make it 8'*8' with the motor shafts at the two top corners
# to see the distortion!

#constants
RES = 3.125
W = 2438.4

#variables
l1 = l2 = x = y = 0

#arrays to plot points
x_points = []
y_points = []

def makePoint(l1,l2):
  x = (l1**2 - l2**2 + W**2)/(2*W)
  y = -(np.sqrt(abs(l1**2 - x**2)))
  
  x_points.append(x)
  y_points.append(y)

while l2 <= W:
  while l1 <= W:
    makePoint(l1,l2)
    l1 +=RES
  l1 = 0
  l2 += RES
  
assert len(x_points) == len(y_points)
  
print len(x_points), "points generated in", W, "x", W, "grid."

plt.scatter(x_points,y_points)
plt.show()
