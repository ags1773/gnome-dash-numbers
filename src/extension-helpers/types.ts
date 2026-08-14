export interface SignalEmitter {
  connect(signal: string, callback: (...args: any[]) => void): number;
  disconnect(id: number): void;
}

export interface SignalConnection {
  object: SignalEmitter;
  id: number;
}
