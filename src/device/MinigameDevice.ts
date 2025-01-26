import 'minigame-api-typings';
import Device from "./Device";


export default class MinigameDevice implements Device {
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
        wx.onTouchStart(() => this.onKeyDown(67));
        wx.onTouchEnd(() => this.onKeyUp(67));
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
    createWebAudioContext(): AudioContext {
        return this.audioContext;
    }
    onKeyUp = (key: number) => {
        throw new Error("Method not implemented.");
    }
    onKeyDown = (key: number) => {
        throw new Error("Method not implemented.");
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

