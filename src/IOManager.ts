import { GridBackground } from "./GridBackground.js";
import { doNothingKeyboardLayout, KeyboardLayout } from "./KeyboardManager.js";
import { Camera, DebugCamera } from "./Scene.js";
import { origin } from "./VectorMath.js";

/**
 * Controls the input from a keyboard or server and the output via the Camera system.
 */
export class IOManager {
  // Stores each of the individual settings we have between 
  private layouts: Array<{ camera: Camera, keyboardLayout: KeyboardLayout }>
  private currLayoutIdx;
  private keysDown: Array<string>;

  /**
   * Initializes a default IOManager with no layouts.
   */
  constructor() {
    this.layouts = [];
    this.keysDown = [];
    this.currLayoutIdx = 0;

    // Cycle through layouts when 'c' is pressed
    addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key == 'c') {
        this.cycle();
      }

      if (!this.keysDown.includes(e.key.toLowerCase())) {
        this.keysDown.push(e.key.toLowerCase());
      }

      this.layouts[this.currLayoutIdx].keyboardLayout.onKeydown(e);
    });

    addEventListener('keyup', (e: KeyboardEvent) => {
      // Remove keys from our list of keys held down
      this.keysDown = this.keysDown.filter((key) => key != e.key.toLowerCase());

      // Call the function associated with pressing a key down
      this.layouts[this.currLayoutIdx].keyboardLayout.onKeyup(e);
    });

    addEventListener('wheel', (e: WheelEvent) => {
      this.layouts[this.currLayoutIdx].keyboardLayout.onScroll(e);
    }, { passive: false });
  }

  /**
   * Renders the output from the current camera
   */
  renderOutput(): void {
    this.layouts[this.currLayoutIdx].camera.renderAll();
  }

  /**
   * Adds a new pair of inputs and outputs. For example, you might want to take inputs from the
   * keyboard to control the player and follow the player with a camera. You may also want to take
   * inputs to manually pan around with arrow keys and simply follow this manually controlled panning
   * point.
   * @param camera the camera to render output from
   * @param keyboardLayout the functions that control where different kinds of input should be piped
   */
  addIOPair(camera: Camera, keyboardLayout: KeyboardLayout): void {
    this.layouts.push({ camera, keyboardLayout });
  }

  /**
   * Sets the current layout to the next layout in our list of layouts.
   */
  cycle(): void {
    // Either increment our layout index by 1 or cycle back to 0 if we're at the end of the list
    if (this.currLayoutIdx >= (this.layouts.length - 1)) {
      this.currLayoutIdx = 0;
    } else {
      this.currLayoutIdx++;
    }
  }

  /**
   * Updates the current camera
   */
  update(deltaTime: number): void {
    this.layouts[this.currLayoutIdx].camera.update(deltaTime);
  }

  /**
   * Returns the keys that are currently being held down
   */
  getKeysDown() {
    return this.keysDown;
  }
}