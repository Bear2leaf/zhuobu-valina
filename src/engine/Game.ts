import { vec2 } from "gl-matrix";
import { addImage, addText, beginDrawing, beginFramebuffer, BLACK, blit, blitRect, blitRectRect, BLUE, calcTextDimensions, clearBackground, createFrameBuffer, drawFPS, drawLine, drawRect, drawText, endDrawing, endFramebuffer, Framebuffer, getScreenHeight, getScreenWidth, isKeyDown, isKeyUp, KeyboardKey, loadText, matTranslate, popMatrix, pushMatrix, rand, RAYWHITE, Rectangle, RED, Texture, TRANSPARENT, WHITE, YELLOW } from "../context";
import Device from "../device/Device";
import { Compiler, Story } from "inkjs/compiler/Compiler";
import createIslandMap from "../island/createIslandMap";
import { BiomeColor } from "../island/biomes";
import IslandMap from "../island/IslandMap";

export default class Game {
    private readonly keyboard = new Set<KeyboardKey>();
    private readonly messages: string[] = [];
    private readonly choices: string[] = [];
    private readonly map = createIslandMap();
    private selection: number = 0;
    private story: Story = null!
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
        const map = this.map;
        const coast = map.r_coast.indexOf(true);
        this.updateStory(coast);
    }
    private updateStory(currentRegion: number) {
        const map = this.map;
        const neighbors = map.mesh.r_circulate_r([], currentRegion).map((r, i) => `* [You can go to ${i}: ${BiomeColor[map.r_biome[r]]} #region ${r}]Arriving ${BiomeColor[map.r_biome[r]]}`);
        const randomEvents = new Array(rand() % 3).fill(0).map((_, i) => `* Random Event ${i}`);
        const content = [
            `You are now at ${BiomeColor[map.r_biome[currentRegion]]}`,
            ...randomEvents,
            ...neighbors
        ].join("\n");
        this.story = new Compiler(content).Compile();
    }

    prepareScene() {
        beginDrawing();
        clearBackground(RAYWHITE);
    }
    doInput() {
        if (isKeyDown(KeyboardKey.KEY_LEFT)) {
            this.keyboard.add(KeyboardKey.KEY_LEFT);
        }
        if (isKeyUp(KeyboardKey.KEY_LEFT)) {
            this.keyboard.delete(KeyboardKey.KEY_LEFT);
        }
        if (isKeyDown(KeyboardKey.KEY_RIGHT)) {
            this.keyboard.add(KeyboardKey.KEY_RIGHT);
        }
        if (isKeyUp(KeyboardKey.KEY_RIGHT)) {
            this.keyboard.delete(KeyboardKey.KEY_RIGHT);
        }
        if (isKeyDown(KeyboardKey.KEY_UP)) {
            this.keyboard.add(KeyboardKey.KEY_UP);
        }
        if (isKeyUp(KeyboardKey.KEY_UP)) {
            this.keyboard.delete(KeyboardKey.KEY_UP);
        }
        if (isKeyDown(KeyboardKey.KEY_DOWN)) {
            this.keyboard.add(KeyboardKey.KEY_DOWN);
        }
        if (isKeyUp(KeyboardKey.KEY_DOWN)) {
            this.keyboard.delete(KeyboardKey.KEY_DOWN);
        }
    }
    logic() {
        if (this.story.canContinue) {
            const message = this.story.Continue();
            if (!message) {
                throw new Error("message is null");
            }
            this.messages.push(message);
        } else if (this.story.currentChoices.length > 0 && this.choices.length === 0) {

            for (let i = 0; i < this.story.currentChoices.length; i++) {
                this.choices.push(this.story.currentChoices[i].text);
            }
        }
        if (this.choices.length !== 0) {
            if (this.keyboard.has(KeyboardKey.KEY_UP)) {
                this.selection--;
                if (this.selection < 0) {
                    this.selection = this.choices.length - 1;
                }
                this.keyboard.delete(KeyboardKey.KEY_UP);
            }
            if (this.keyboard.has(KeyboardKey.KEY_DOWN)) {
                this.selection++;
                if (this.selection >= this.choices.length) {
                    this.selection = 0;
                }
                this.keyboard.delete(KeyboardKey.KEY_DOWN);
            }
        }
        if (this.keyboard.has(KeyboardKey.KEY_RIGHT)) {
            if (this.choices.length !== 0) {
                const tags = this.story.currentChoices[this.selection].tags;
                if (tags && tags.length === 1) {
                    const [type, r] = tags[0].split(" ") as [string, number];
                    if (type === "region") {
                        this.updateStory(r);
                    } else {
                        throw new Error(`Unknown tag type: ${type}`);
                    }
                } else {
                    this.story.ChooseChoiceIndex(this.selection);
                }
                this.selection = 0;
                this.choices.length = 0;
                this.keyboard.delete(KeyboardKey.KEY_RIGHT);
            }
        }
        if (this.keyboard.has(KeyboardKey.KEY_LEFT)) {
            this.story.ResetState();
            this.selection = 0;
            this.choices.length = 0;
            this.messages.length = 0;
            this.keyboard.delete(KeyboardKey.KEY_LEFT);
        }
    }
    draw() {
        pushMatrix();
        matTranslate(0, getScreenHeight() / 2, 0);
        for (let i = 0; i < this.messages.length; i++) {
            const msg = this.messages[this.messages.length - i - 1];
            if (msg) {
                calcTextDimensions(msg, 20, "left", getScreenWidth(), dims)
                drawText(msg, 0, -dims[1], 20, BLACK, "left", getScreenWidth());
                matTranslate(0, -dims[1], 0);
            }
        }
        popMatrix();
        pushMatrix();
        matTranslate(0, getScreenHeight() / 2, 0);
        for (let i = 0; i < this.choices.length; i++) {
            calcTextDimensions(this.choices[i], 20, "left", getScreenWidth(), dims)
            drawText(this.choices[i], 0, 0, 20, this.selection === i ? RED : BLACK, "left", getScreenWidth());
            matTranslate(0, dims[1], 0);
        }
        popMatrix();

        drawFPS(getScreenWidth() - 80, getScreenHeight() - 40);
    }



    presentScene() {
        endDrawing();
    }

}
const dims = vec2.create();