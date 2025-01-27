
export default interface Device {
  getCanvasGL(): HTMLCanvasElement;
  getWindowInfo(): WechatMinigame.WindowInfo;
  now(): number;
  loadSubpackage(): Promise<null>;
  createWebAudioContext(): AudioContext;
  onKeyUp(key: number): void;
  onKeyDown(key: number): void;
  onMouseMove(x: number, y: number): void;
  onMouseDown(button: number): void;
  onMouseUp(button: number): void;
  loadText(url: string): Promise<string>;
  loadImage(url: string): Promise<HTMLImageElement>;
  loadBuffer(url: string): Promise<ArrayBuffer>;
  onMouseWheel(delta: number): void;
}