import { addImage, addText, initContext, initDrawobjects, initPrograms, loadFontData } from "./context.js";
import Device from "./device/Device.js";
import Game from "./shooter01/Game.js";
export async function mainH5() {
    const BrowserDevice = (await import("./device/BrowserDevice")).default;
    const device = new BrowserDevice();
    new EventSource('/esbuild').addEventListener('change', (e) => {
        location.reload()
    });
    return device;
}
export async function mainMinigame() {
    const MinigameDevice = (await import("./device/MinigameDevice")).default;
    const device = new MinigameDevice();
    await device.loadSubpackage();
    return device;
}
export async function start(device: Device) {
    addText("resources/font/NotoSansSC-Regular.json", await device.loadText("resources/font/NotoSansSC-Regular.json"));
    addText("resources/glsl/text.vert.sk", await device.loadText("resources/glsl/text.vert.sk"));
    addText("resources/glsl/text.frag.sk", await device.loadText("resources/glsl/text.frag.sk"));
    addText("resources/glsl/sprite.vert.sk", await device.loadText("resources/glsl/sprite.vert.sk"));
    addText("resources/glsl/sprite.frag.sk", await device.loadText("resources/glsl/sprite.frag.sk"));
    addImage("resources/font/NotoSansSC-Regular.png", await device.loadImage("resources/font/NotoSansSC-Regular.png"));
    addImage("resources/image/player.png", await device.loadImage("resources/image/player.png"));
    addImage("resources/image/playerBullet.png", await device.loadImage("resources/image/playerBullet.png"));
    addImage("resources/image/alienBullet.png", await device.loadImage("resources/image/alienBullet.png"));
    addImage("resources/image/enemy.png", await device.loadImage("resources/image/enemy.png"));
    initContext(device);

    loadFontData(
        "resources/font/NotoSansSC-Regular.json",
        "resources/font/NotoSansSC-Regular.png"
    );
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
    console.log(1)
}



declare const wx: WechatMinigame.Wx | undefined;

(typeof wx !== "undefined" ? mainMinigame : mainH5)().then(start);


declare const location: { reload(): void };
declare class EventSource {
    constructor(url: string)
    addEventListener(type: "change", listener: (e: { data: string }) => void): void;
}