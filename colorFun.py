class ColorWheel:
   """Gives different distinctive colors."""

   color_list = [(255,0,0),(255,128,0),(255,255,0),(0,255,0),(0,255,255),(0,128,255),(123,51,255),(255,51,153)]

   def __init__(self,color_index=0):
      self.color_index = color_index

   def getColor(self):
     return self.color_list[self.color_index]
     
   def nextColor(self):
     self.color_index += 1
     if self.color_index > len(self.color_list) - 1:
       self.color_index = 0
