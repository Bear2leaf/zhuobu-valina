import Device from "./Device";
function getWindowInfo(canvas: HTMLCanvasElement): WechatMinigame.WindowInfo {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio,
        statusBarHeight: 0,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        safeArea: {
            bottom: window.innerHeight,
            height: window.innerHeight,
            left: 0,
            right: window.innerWidth,
            top: 0,
            width: window.innerWidth
        },
        screenTop: 0
    }
}
export default class BrowserDevice implements Device {
    private readonly windowInfo: WechatMinigame.WindowInfo;
    private readonly canvasGL: HTMLCanvasElement
    constructor() {
        this.canvasGL = document.createElement("canvas");
        document.body.appendChild(this.canvasGL);
        this.windowInfo = getWindowInfo(this.canvasGL);
        window.addEventListener("keydown", (e) => this.onKeyDown(e.keyCode));
        window.addEventListener("keyup", (e) => this.onKeyUp(e.keyCode));
        window.addEventListener("resize", () => {
            Object.assign(this.windowInfo, getWindowInfo(this.canvasGL));
            this.onResize()
        });
    }
    onResize: () => void = () => {
        throw new Error("Method not implemented.");
    };
    onKeyUp = (key: number) => {
        throw new Error("Method not implemented.");
    }
    onKeyDown = (key: number) => {
        throw new Error("Method not implemented.");
    }
    getCanvasGL(): HTMLCanvasElement {
        return this.canvasGL;
    }
    getWindowInfo(): WechatMinigame.WindowInfo {
        return this.windowInfo
    }
    now(): number {
        return performance.now();
    }
    async loadSubpackage() {
        return null;
    }
    createWebAudioContext(): AudioContext {
        return new AudioContext();
    }
    loadText(url: string): Promise<string> {
        return fetch(url).then(response => response.text());
    }
    loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
        });
    }
}



declare const document: {
    createElement: (tagName: string) => HTMLCanvasElement;
    body: {
        appendChild: (element: HTMLCanvasElement) => void;
    }
}
declare const window: {
    innerWidth: number;
    innerHeight: number;
    devicePixelRatio: number;
    addEventListener(type: "keydown", listener: (e: { keyCode: number }) => void): void;
    addEventListener(type: "keyup", listener: (e: { keyCode: number }) => void): void;
    addEventListener(type: "resize", listener: () => void): void;
}
declare const performance: {
    now: () => number;
}
declare type Response = {
    text(): Promise<string>;
}
declare const fetch: (url: string) => Promise<Response>;