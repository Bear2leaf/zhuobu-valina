import { vec2 } from "gl-matrix";
import { addImage, addText, beginDrawing, beginFramebuffer, BLACK, blit, blitRect, blitRectRect, BLUE, calcTextDimensions, clearBackground, createFrameBuffer, drawFPS, drawLine, drawRect, drawText, drawTextBoxed, drawTypeWriter, endDrawing, endFramebuffer, Framebuffer, getScreenHeight, getScreenWidth, matTranslate, popMatrix, pushMatrix, RAYWHITE, Rectangle, Texture, TRANSPARENT, WHITE, YELLOW } from "../context";
import Device from "../device/Device";

export default class Game {
    private readonly textDimensions: vec2 = vec2.create();
    async load(device: Device) {
        await addText("font/NotoSansSC-Regular.json", device);
        await addText("glsl/color.vert.sk", device);
        await addText("glsl/color.frag.sk", device);
        await addText("glsl/text.vert.sk", device);
        await addText("glsl/text.frag.sk", device);
        await addText("glsl/sprite.vert.sk", device);
        await addText("glsl/sprite.frag.sk", device);
        await addImage("font/NotoSansSC-Regular", device);
    }
    init() {
    }
    prepareScene() {
        beginDrawing();
        clearBackground(RAYWHITE);
    }
    doInput() {
    }
    logic() {
    }
    draw() {
        pushMatrix();
        const content = "The greatest works of William Shakespeare, as written by an SDL TTF tutorial. A million monkeys using a million typewriters could manage the same thing in a few years. Perhaps?";
        drawTextBoxed(content, 0, 0)
        drawTypeWriter(content, 0, 200, (this.frames++ / 10) % content.length);
        drawText(content, 0, 320, { width: getScreenWidth() / 2 });
        drawText(content, getScreenWidth(), 320, { align: "right", width: getScreenWidth() / 2 });
        drawText("Hello World!", getScreenWidth() / 2, 300, { align: "center", width: getScreenWidth() / 2 });
        popMatrix();
    }
    frames = 0;


    presentScene() {
        endDrawing();
    }

}
