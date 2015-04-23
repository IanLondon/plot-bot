import numpy as np
import matplotlib.pyplot as plt
  
#This is for the special case where we are drawing a vertical line in the 
#center of the board, so l_1 === l_2. 
#
#Also, I put the motors at the top edge of the board with no space!
  
  
l_resolution   = 3.125 #7.5-deg step with 150mm pulley circumference
X = 1219.2 #4 ft
max_l = np.sqrt(2)*X

#start at y=0 so l=X.
l=X

y_vals = []

while l <= max_l:
  y = np.sqrt(l**2-X**2)
  #print 'y =', y
  y_vals.append(y)
  l += l_resolution

y_res = []
  
for i in range(len(y_vals)-1):
  y_res.append( y_vals[i+1] - y_vals[i] )
  
assert y_res[0] == y_vals[1]
assert len(y_res)+1 == len(y_vals)

#stats
print "All values in millimeters."
print "median resolution:", np.median(y_res)
print "best (min) res:", np.amin(y_res)
print "worst (max) res:", np.amax(y_res)
print "res bounds (0, -1. Should be max, min):",y_res[0],y_res[-1]
print ""
print "By the way, this is a bad placement for the steppers. You're putting them so the rotors are only as high as the top of the board!"
#Do a plot of the y vals
#plt.scatter(range(len(y_vals)),y_vals)
#plt.show()

#Do a plot of the y resolution
plt.scatter(range(len(y_res)),y_res)
plt.show()
