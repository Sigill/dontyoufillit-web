export type Observer = (...args: any[]) => void;

export class Observable {
  #observers = new Array<Observer>();

  addObserver(observer: Observer): void {
    this.#observers.push(observer);
  }

  removeObserver(observer: Observer): void {
    const index = this.#observers.indexOf(observer);
    if (index !== -1) {
      this.#observers.splice(index, 1);
    }
  }

  hasObserver(observer: Observer): boolean {
    const index = this.#observers.indexOf(observer);
    return index !== -1;
  }

  notifyObservers(...args: any[]): void {
    for (let i = this.#observers.length - 1; i >= 0; i--) {
      this.#observers[i](...args);
    }
  }
}
