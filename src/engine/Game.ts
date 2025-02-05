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
    private readonly regionStory: Map<number, Story> = new Map();
    private readonly stories: readonly string [] = [
        "beach",
        "ocean"
    ]
    private selection: number = 0;
    private currentRegion = 0;
    async load(device: Device) {
        await addText("font/NotoSansSC-Regular.json", device);
        await addText("glsl/color.vert.sk", device);
        await addText("glsl/color.frag.sk", device);
        await addText("glsl/text.vert.sk", device);
        await addText("glsl/text.frag.sk", device);
        await addText("glsl/sprite.vert.sk", device);
        await addText("glsl/sprite.frag.sk", device);
        for (const story of this.stories) {
            await addText(`story/${story}.txt`, device);
        }
        await addImage("font/NotoSansSC-Regular", device);
    }
    init() {
        const map = this.map;
        const coast = map.r_coast.indexOf(true);
        this.updateStory(coast);
    }
    private updateStory(currentRegion: number) {
        this.currentRegion = currentRegion;
        const map = this.map;
        if (!this.regionStory.has(currentRegion)) {
            const content = loadText(`story/${BiomeColor[map.r_biome[currentRegion]].toLowerCase()}.txt`);
            const story = new Compiler(content).Compile();
            this.regionStory.set(currentRegion, story);
        }
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
        const story = this.regionStory.get(this.currentRegion);
        if (!story) {
            throw new Error("story is null");
        }
        if (story.canContinue) {
            const message = story.Continue();
            if (!message) {
                throw new Error("message is null");
            }
            this.messages.push(message);
        } else if (story.currentChoices.length > 0 && this.choices.length === 0) {

            for (let i = 0; i < story.currentChoices.length; i++) {
                this.choices.push(story.currentChoices[i].text);
            }
            const neighbors = this.map.mesh.r_circulate_r([], this.currentRegion);
            for (let i = 0; i < neighbors.length; i++) {
                this.choices.push(`Go to ${BiomeColor[this.map.r_biome[neighbors[i]]]}`);
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
                if (story.currentChoices.length > this.selection) {
                    story.ChooseChoiceIndex(this.selection);
                } else {
                    const neighbors = this.map.mesh.r_circulate_r([], this.currentRegion);
                    const regionChoice = this.selection - story.currentChoices.length;
                    const next = neighbors[regionChoice];
                    console.log(next)
                    this.updateStory(next);
                }
                this.selection = 0;
                this.choices.length = 0;
                this.keyboard.delete(KeyboardKey.KEY_RIGHT);
            }
        }
        if (this.keyboard.has(KeyboardKey.KEY_LEFT)) {
            story.ResetState();
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