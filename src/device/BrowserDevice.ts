import { vec2 } from "gl-matrix";
import Device from "./Device";
import { KeyboardKey } from "../context";
function getWindowInfo(canvas: HTMLCanvasElement): WechatMinigame.WindowInfo {
    const info = {
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
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    return info;
}
export default class BrowserDevice implements Device {
    private worker?: Worker;
    private readonly windowInfo: WechatMinigame.WindowInfo;
    private readonly canvasGL: HTMLCanvasElement
    private readonly audioContext: AudioContext = new AudioContext();
    constructor() {
        this.canvasGL = document.createElement("canvas");
        document.body.appendChild(this.canvasGL);
        this.windowInfo = getWindowInfo(this.canvasGL);
        window.addEventListener("keydown", (e) => {
            this.onKeyDown(e.keyCode)
            this.onInput();
        });
        window.addEventListener("keyup", (e) => {
            this.onKeyUp(e.keyCode)
            this.onInput();
        });
        window.addEventListener("resize", () => {
            Object.assign(this.windowInfo, getWindowInfo(this.canvasGL));
            this.onResize()
        });
        let dx = 0;
        let dy = 0;
        let x = 0;
        let y = 0;
        window.addEventListener("touchmove", (e) => {
            dx = e.touches[0].clientX - x;
            dy = e.touches[0].clientY - y;
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;


        });
        window.addEventListener("touchstart", (e) => {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
            this.onKeyUp(KeyboardKey.KEY_LEFT);
            this.onKeyUp(KeyboardKey.KEY_RIGHT);
            this.onKeyUp(KeyboardKey.KEY_UP);
            this.onKeyUp(KeyboardKey.KEY_DOWN);
        });
        window.addEventListener("touchend", (e) => {
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
        window.addEventListener("contextmenu", (e) => e.preventDefault());

    }
    onInput(): void {

    }
    onResize: () => void = () => {

    };
    onKeyUp = (key: number) => {

    }
    onKeyDown = (key: number) => {

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
    sendmessage(message: MainMessage): void {
        if (this.worker) {
            this.worker.postMessage(message);
        }
    }
    onmessage(message: WorkerMessage): void {
        console.log(message);
    }
    createWorker(url: string): void {
        this.worker = new Worker(url, { type: "module" });
        this.worker.onerror = (e) => {
            throw new Error("worker error");
        };
        this.worker.onmessage = (e) => {
            this.onmessage(e.data);
        };
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
    addEventListener(type: "contextmenu", listener: (e: { preventDefault(): void }) => void): void;
    addEventListener(type: "touchstart", listener: (e: { touches: { clientX: number, clientY: number }[] }) => void): void;
    addEventListener(type: "touchmove", listener: (e: { touches: { clientX: number, clientY: number }[] }) => void): void;
    addEventListener(type: "touchend", listener: (e: { touches: { clientX: number, clientY: number }[] }) => void): void;
}
declare const performance: {
    now: () => number;
}
declare type Response = {
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
}
declare const fetch: (url: string) => Promise<Response>;