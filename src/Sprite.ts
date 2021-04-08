/**
 * A Sprite has information about a its frames. The most important part of a Sprite is its ability
 * to return a frame given a certain angle. More information in `getSpriteFrame(angle)`
 */
class Sprite {
  private sheet: CanvasImageSource;
  private xStart: number;
  private yStart: number; 
  private frameWidth: number;
  private frameHeight: number;

  /**
   * Constructs a Sprite given all relevant properties.
   * @param sheet An image containing all this Sprite's frames
   * @param xStart The x position of this Sprite's the first frame 
   * @param yStart The y position of this Sprite's the first frame 
   * @param frameWidth The width of this Sprite's frames
   * @param frameHeight The height of this Sprite's frames 
   */
  constructor(sheet: CanvasImageSource, xStart: number, yStart: number, frameWidth: number, 
    frameHeight: number) {
    this.sheet = sheet;
    this.xStart = xStart;
    this.yStart = yStart;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
  }

  /**
   * Returns the frame that most closely matches the angle you want. For instance, if you pass in 91
   * degrees as the angle, you might get a sprite that's facing 90 degrees if there isn't a frame to
   * better represent 91 degrees.
   * @param angle the angle of the sprite frame you want in degrees
   */
  getSpriteFrame(angle: number) {
    
  }
}