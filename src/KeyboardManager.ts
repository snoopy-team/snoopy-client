/**
 * An object that can receive keyboard input and scroll input
 */
export interface KeyboardLayout {
  onKeydown: (e: KeyboardEvent) => void,
  onKeyup: (e: KeyboardEvent) => void,
  onScroll: (e: WheelEvent) => void
}

// Examples
const doNothing = () => {};
export const doNothingKeyboardLayout = 
  { onKeydown: doNothing, onKeyup: doNothing, onScroll: doNothing };

/**
 * Streamlines keyboard input so that only one set of keyboard controls is in effect at one time.
 */
export class KeyboardManager {
  private listeners: Array<KeyboardLayout>;
  private currListenerIdx;

  /**
   * Initialize listeners object with a single default that does nothing, listen to keybaord events
   * so we can stream events to the subscriber with this.currListenerID
   */
  constructor() {
    // Create listeners and initialize with a keyboard control schema that does nothing.
    this.listeners = [];
    this.currListenerIdx = 0;
    this.listeners[0] = doNothingKeyboardLayout;

    // Listen to keyboard events so we can stream it to the current subscriber
    addEventListener('keydown', (e: KeyboardEvent) => {
      // Cycle where to send input to
      if (e.key == 'c') {
        this.currListenerIdx++;
      }

      this.listeners[this.currListenerIdx].onKeydown(e);
    }); 
    addEventListener('keyup', (e: KeyboardEvent) => {
      this.listeners[this.currListenerIdx].onKeyup(e);
    });
    addEventListener('wheel', (e: WheelEvent) => {
      this.listeners[this.currListenerIdx].onScroll(e);
    }, { passive: false });
  }

  /**
   * Adds this InputReceiver to the list of listeners of this KeyboardManager. When keys are 
   * pressed, the key name (i.e. 'q') will be sent to the InputReceiver.
   * @param receiver where we'll route the events we get from the keyboard input
   */
  addListener(receiver: KeyboardLayout) {
    this.listeners.push(receiver);
  }
}