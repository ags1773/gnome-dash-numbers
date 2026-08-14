import { SignalEmitter, SignalConnection } from "./types.js";

export class SignalManager {
  private _signals: SignalConnection[] = [];

  add(
    object: SignalEmitter | null | undefined,
    signal: string,
    callback: (...args: any[]) => void,
  ): void {
    if (!object) return;
    const id = object.connect(signal, callback);
    this._signals.push({ object, id });
  }

  disconnectAll(): void {
    for (const { object, id } of this._signals) {
      object.disconnect(id);
    }
    this._signals = [];
  }
}
