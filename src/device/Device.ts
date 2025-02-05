
export default interface Device {
  sendmessage: (message: MainMessage) => void;
  onmessage: (message: WorkerMessage) => void;
  createWorker(url: string): void;
  getCanvasGL(): HTMLCanvasElement;
  getWindowInfo(): WechatMinigame.WindowInfo;
  now(): number;
  loadSubpackage(): Promise<null>;
  createWebAudioContext(): AudioContext;
  onKeyUp(key: number): void;
  onKeyDown(key: number): void;
  loadText(url: string): Promise<string>;
  loadImage(url: string): Promise<HTMLImageElement>;
  loadBuffer(url: string): Promise<ArrayBuffer>;
  onInput(): void;
}