import pygame
from pygame.locals import *
import math
from colorFun import ColorWheel

#constants
RES = 3.125
W = 2438.4

#flags
MONOCHROME = False

def getPoints(l1,l2):
  x = (l1**2 - l2**2 + W**2)/(2*W)
  if l1 == x:
    y=0
  else:
    try: y = (math.sqrt(l1**2 - x**2))
    except ValueError:
      print "ValueError! l1,x:",l1,x
      y=0
  x = int(x/3)
  y = int(y/3)
#  print x, y
  return x, y

def drawAllPoints(screen):
  #variables
  l1 = l2 = x = y = 0

  colors = ColorWheel()

  if MONOCHROME:
    colors.color_list = [(255,255,255)]

  while l2 <= W:
    l1 = W - l2
    while l1 <= W:
      screen.set_at(getPoints(l1,l2), colors.getColor())
      #this would update every pixel. very slow!
      #pygame.display.update()
      l1 +=RES
    #this updates every l2 increment
    pygame.display.update()
    l1 = 0
    l2 += RES
    colors.nextColor()
    

def main():
  # Initialise screen
  pygame.init()
  screen = pygame.display.set_mode((850, 800))
  pygame.display.set_caption('Wall robot - all points')

  # Fill background
  background = pygame.Surface(screen.get_size())
  background = background.convert()
  background.fill((250, 250, 250))

  drawAllPoints(screen)
  print "DONE!"

  # Event loop
  while 1:
    for event in pygame.event.get():
      if event.type == QUIT:
        return

      


if __name__ == '__main__': main()
