/**
 * Serializes lifecycle operations that must never overlap (start, reconnect,
 * disconnect). A failed operation does not poison the queue.
 */
export class SerialTaskQueue {
  private tail: Promise<void> = Promise.resolve();

  run<T>(task: () => Promise<T> | T): Promise<T> {
    const result = this.tail.then(task);
    this.tail = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }
}
