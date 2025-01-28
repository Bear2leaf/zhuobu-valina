import Game from "./ppp/Game.js";
import { addAudioBuffer, addImage, addText, initContext, initDrawobjects, initPrograms, initWindow } from "./context.js";
import Device from "./device/Device.js";
export async function mainH5() {
    const BrowserDevice = (await import("./device/BrowserDevice")).default;
    const device = new BrowserDevice();
    new EventSource('/esbuild').addEventListener('change', (e) => {
        location.reload()
    });
    device.onResize = () => {
        initWindow(0, 0, "");
    }
    return device;
}
export async function mainMinigame() {
    const MinigameDevice = (await import("./device/MinigameDevice")).default;
    const device = new MinigameDevice();
    await device.loadSubpackage();
    return device;
}
export async function start(device: Device) {
    const game = new Game();
    await game.load(device);
    initContext(device);
    initPrograms();
    initDrawobjects();
    initWindow(0, 0, "");
    game.init();
    function loop() {
        game.prepareScene();
        game.doInput();
        game.logic();
        game.draw();
        game.presentScene();
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
}



declare const wx: WechatMinigame.Wx | undefined;

(typeof wx !== "undefined" ? mainMinigame : mainH5)().then(start);


declare const location: { reload(): void };
declare class EventSource {
    constructor(url: string)
    addEventListener(type: "change", listener: (e: { data: string }) => void): void;
}