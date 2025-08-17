/**
 * A simple debouncer class to limit the rate at which a function is called.
 */
export class Debouncer {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly delay: number;

  /**
   * Creates a new Debouncer instance.
   * @param delay The debounce delay in milliseconds.
   */
  constructor(delay: number) {
    this.delay = delay;
  }

  /**
   * Debounces the execution of a function.
   * If called multiple times within the delay, only the last call will execute after the delay.
   * @param func The function to debounce.
   * @param args Arguments to pass to the function.
   */
  debounce<T extends any[]>(func: (...args: T) => void, ...args: T): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      func(...args);
      this.timeoutId = null; // Clear the timeout ID after execution
    }, this.delay);
  }

  /**
   * Immediately cancels any pending debounced execution.
   */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
