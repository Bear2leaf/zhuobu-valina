import { addAudioBuffer, addImage, addText, initContext, initDrawobjects, initPrograms, initWindow } from "./context.js";
import Device from "./device/Device.js";
import Game from "./shooter01/Game.js";
export async function mainH5() {
    const BrowserDevice = (await import("./device/BrowserDevice")).default;
    const device = new BrowserDevice();
    new EventSource('/esbuild').addEventListener('change', (e) => {
        location.reload()
    });
    device.onResize = () => {
        initWindow(0,0,"");
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
    await addText("font/NotoSansSC-Regular.json", device);
    await addText("glsl/line.vert.sk", device);
    await addText("glsl/line.frag.sk", device);
    await addText("glsl/text.vert.sk", device);
    await addText("glsl/text.frag.sk", device);
    await addText("glsl/sprite.vert.sk", device);
    await addText("glsl/sprite.frag.sk", device);
    await addImage("font/NotoSansSC-Regular", device);
    await addImage("image/player", device);
    await addImage("image/playerBullet", device);
    await addImage("image/alienBullet", device);
    await addImage("image/enemy", device);
    await addImage("image/background", device);
    await addImage("image/explosion", device);
    await addImage("image/points", device);
    await addAudioBuffer("music/Mercury.mp3", device);
    initContext(device);

    initPrograms();
    initDrawobjects();
    const game = new Game();
    game.init();
    function loop() {
        game.doInput();
        game.prepareScene();
        game.update();
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