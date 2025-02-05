import 'minigame-api-typings';
import Device from "./Device";
import { vec2 } from 'gl-matrix';
import { KeyboardKey } from '../context';


export default class MinigameDevice implements Device {
    private worker?: WechatMinigame.Worker;
    private readonly windowInfo: WechatMinigame.WindowInfo;
    private readonly canvasGL: HTMLCanvasElement
    private readonly audioContext: WechatMinigame.WebAudioContext = wx.createWebAudioContext();
    private readonly divideTimeBy: number;
    private startupTime: number = wx.getPerformance().now();
    constructor() {
        this.canvasGL = wx.createCanvas() as unknown as HTMLCanvasElement;
        const info = wx.getWindowInfo();
        (this.canvasGL.width) = info.windowWidth * info.pixelRatio;
        (this.canvasGL.height) = info.windowHeight * info.pixelRatio;
        this.windowInfo = wx.getWindowInfo()
        const isDevTool = wx.getDeviceInfo().platform === "devtools";
        this.divideTimeBy = isDevTool ? 1 : 1000;
        let dx = 0;
        let dy = 0;
        let x = 0;
        let y = 0;
        wx.onTouchStart((e) => {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
            this.onKeyUp(KeyboardKey.KEY_LEFT);
            this.onKeyUp(KeyboardKey.KEY_RIGHT);
            this.onKeyUp(KeyboardKey.KEY_UP);
            this.onKeyUp(KeyboardKey.KEY_DOWN);
        });
        wx.onTouchMove((e) => {
            dx = e.touches[0].clientX - x;
            dy = e.touches[0].clientY - y;
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        });
        wx.onTouchEnd((e) => {
            if (vec2.length([dx, dy]) > 10) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > 0) {
                        this.onKeyDown(KeyboardKey.KEY_RIGHT);
                    } else {
                        this.onKeyDown(KeyboardKey.KEY_LEFT);
                    }
                } else {
                    if (dy > 0) {
                        this.onKeyDown(KeyboardKey.KEY_DOWN);
                    } else {
                        this.onKeyDown(KeyboardKey.KEY_UP);
                    }
                }
                this.onInput()
            }
            dx = 0;
            dy = 0;

        });
    }
    getWindowInfo(): WechatMinigame.WindowInfo {
        return this.windowInfo
    }
    getCanvasGL(): HTMLCanvasElement {
        return this.canvasGL as unknown as HTMLCanvasElement;
    }
    now(): number {
        return (wx.getPerformance().now() - this.startupTime) / this.divideTimeBy;
    }
    async loadSubpackage() {
        return await new Promise<null>(resolve => {
            const task = wx.loadSubpackage({
                name: "resources",
                success(res: { errMsg: string }) {
                    console.debug("load resources success", res)
                    resolve(null);
                },
                fail(res: { errMsg: string }) {
                    console.error("load resources fail", res)
                },
                complete() {
                    console.debug("load resources complete");
                }
            })

            task.onProgressUpdate((res) => {
                console.debug(`onProgressUpdate: ${res.progress}, ${res.totalBytesExpectedToWrite}, ${res.totalBytesWritten}`)
            })
        });
    }
    sendmessage(message: MainMessage): void {
        if (this.worker) {
            this.worker.postMessage(message);
        }
    }
    onmessage(message: WorkerMessage): void {
        console.log(message);
    }
    createWorker(url: string): void {
        this.worker = wx.createWorker(url, { useExperimentalWorker: true });
        this.worker.onMessage((message) => {
            this.onmessage(message as unknown as WorkerMessage);
        });
        this.worker.onProcessKilled(() => {
            console.log("worker killed");
        });
    }
    createWebAudioContext(): AudioContext {
        return this.audioContext;
    }
    onInput(): void {
        
    }
    onKeyUp = (key: number) => {
    }
    onKeyDown = (key: number) => {
    }
    loadText(url: string): Promise<string> {
        return Promise.resolve(wx.getFileSystemManager().readFileSync(url, "utf8") as string);
    }
    loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve) => {
            const img = wx.createImage();
            img.src = url;
            img.onload = () => resolve(img);
        });
    }
    loadBuffer(url: string): Promise<ArrayBuffer> {
        return Promise.resolve(wx.getFileSystemManager().readFileSync(url) as ArrayBuffer);
    }
}

