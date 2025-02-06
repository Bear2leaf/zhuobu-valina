import { vec2 } from "gl-matrix";
import { addImage, addText, beginDrawing, beginFramebuffer, BLACK, blit, blitRect, blitRectRect, BLUE, calcTextDimensions, clearBackground, createFrameBuffer, drawFPS, drawLine, drawRect, drawText, endDrawing, endFramebuffer, Framebuffer, getScreenHeight, matTranslate, popMatrix, pushMatrix, RAYWHITE, Rectangle, Texture, TRANSPARENT, WHITE, YELLOW } from "../context";
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
    content = "Hello, world";
    draw() {
        const textDimensions: vec2 = vec2.create();
        this.content += " .";
        const content = this.content;
        if (content.length > 60) {
            this.content = "Hello, world";
        }
        calcTextDimensions(content, 60, "left", 300, textDimensions);
        pushMatrix();
        matTranslate(60, 60, 0);
        drawRect(0, 0, textDimensions[0], textDimensions[1], YELLOW, 10, BLACK);
        drawText(content, 10, 10, 60, BLACK, "left", 300);


        popMatrix();
    }



    presentScene() {
        endDrawing();
    }

}
