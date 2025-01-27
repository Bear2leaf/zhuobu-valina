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
    private readonly audioContext: AudioContext = new AudioContext();
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
        window.addEventListener("mousemove", (e) => this.onMouseMove(e.clientX, e.clientY));
        window.addEventListener("mousedown", (e) => this.onMouseDown(e.button));
        window.addEventListener("mouseup", (e) => this.onMouseUp(e.button));
        window.addEventListener("contextmenu", (e) => e.preventDefault());
        window.addEventListener("wheel", (e) => this.onMouseWheel(e.deltaY));

    }
    onMouseWheel(delta: number): void {
        throw new Error("Method not implemented.");
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
    onMouseMove(x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    onMouseDown(button: number): void {
        throw new Error("Method not implemented.");
    }
    onMouseUp(button: number): void {
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
        return this.audioContext;
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
    loadBuffer(url: string): Promise<ArrayBuffer> {
        return fetch(url).then(response => response.arrayBuffer());
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
    addEventListener(type: "mousemove", listener: (e: { clientX: number, clientY: number }) => void): void;
    addEventListener(type: "mousedown", listener: (e: { button: number }) => void): void;
    addEventListener(type: "mouseup", listener: (e: { button: number }) => void): void;
    addEventListener(type: "contextmenu", listener: (e: { preventDefault(): void }) => void): void;
    addEventListener(type: "wheel", listener: (e: { deltaY: number }) => void): void;
}
declare const performance: {
    now: () => number;
}
declare type Response = {
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
}
declare const fetch: (url: string) => Promise<Response>;