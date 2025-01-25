import { mat4, vec4 } from "gl-matrix";
import Device from "./device/Device";
import { Convert, MTSDFFontData } from "./mtsdf/MTSDFFontData";
import { MTSDFText } from "./mtsdf/MTSDFText";

const _attributeLocs: WeakMap<WebGLProgram, Record<string, number>> = new WeakMap();
const _uniformLocs: WeakMap<WebGLProgram, Record<string, WebGLUniformLocation>> = new WeakMap();
const _mtsdfTexts: Record<string, MTSDFText> = {};
function cacheMTSDFText(content: string, fontData: MTSDFFontData, size: number): MTSDFText {
    const key = `${content}_${size}`;
    if (_mtsdfTexts[key] === undefined) {
        _mtsdfTexts[key] = new MTSDFText({font: fontData, text: content, size});
    }
    return _mtsdfTexts[key];
}
function cacheAttributeLocation(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): number {
    
    let attribLocs = _attributeLocs.get(program);
    if (attribLocs === undefined) {
        attribLocs = {};
        _attributeLocs.set(program, attribLocs);
    }
    if (attribLocs[name] === undefined) {
        attribLocs[name] = gl.getAttribLocation(program, name);
    }
    return attribLocs[name];
}
function cacheUniformLocation(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation {
    let uniformLocs = _uniformLocs.get(program);
    if (uniformLocs === undefined) {
        uniformLocs = {};
        _uniformLocs.set(program, uniformLocs);
    }
    if (uniformLocs[name] === undefined) {
        const loc = gl.getUniformLocation(program, name);
        if (loc === null) throw new Error(`uniform ${name} not found`);
        uniformLocs[name] = loc;
    }
    return uniformLocs[name];
}

type Drawobject = {
    vao: WebGLVertexArrayObject;
    vboPosition: WebGLBuffer;
    vboTexcoord: WebGLBuffer;
    ebo: WebGLBuffer;
    program: WebGLProgram;
    textures: readonly Texture[];
}

const context = {
    device: null! as Device,
    gl: null! as WebGL2RenderingContext,
    time: 0,
    fps: 0,
    frameTime: 0,
    keyboard: new Set<number>(),
    textDrawobject: null! as Drawobject,
    spriteDrawobject: null! as Drawobject,
    fontData: null! as MTSDFFontData,
    textProgram: null! as WebGLProgram,
    spriteProgram: null! as WebGLProgram,
    textTexture: null! as Texture,
}

const images = new Map<string, HTMLImageElement>();
const texts = new Map<string, string>();

function createDrawobject(program: WebGLProgram, textures: readonly Texture[]): Drawobject {
    const { gl } = context;
    const vao = gl.createVertexArray();
    if (!vao) throw new Error("createVertexArray failed");
    const ebo = gl.createBuffer();
    if (!ebo) throw new Error("createBuffer failed");
    const vbo = gl.createBuffer();
    if (!vbo) throw new Error("createBuffer failed");
    const vbo1 = gl.createBuffer();
    if (!vbo1) throw new Error("createBuffer failed");
    return { vao, vboPosition: vbo, vboTexcoord: vbo1, ebo, program, textures };
}
export function addImage(name: string, img: HTMLImageElement) {
    images.set(name, img);
}
export function addText(name: string, text: string) {
    texts.set(name, text);
}
export function loadFontData(font: string, img: string) {
    const image = images.get(img);
    if (!image) throw new Error("image not found");
    context.textTexture = createTexture(image, true);
    const fontDataText = texts.get(font);
    if (!fontDataText) throw new Error("fontDataText not loaded");
    context.fontData = Convert.toMTSDFFontData(fontDataText);
}
function createTexture(img: HTMLImageElement, linear: boolean = false): Texture {
    const { gl } = context;
    const texture = gl.createTexture();
    if (!texture) throw new Error("createTexture failed");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, linear ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return { tex: texture, width: img.width, height: img.height };
}

function createShaderProgram(vert: string, frag: string) {
    const { gl } = context;
    const program = gl.createProgram();
    if (!program) throw new Error("createProgram failed");
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertShader) throw new Error("createShader failed");
    gl.shaderSource(vertShader, vert);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(vertShader) || "compileShader failed");
    }
    gl.attachShader(program, vertShader);
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragShader) throw new Error("createShader failed");
    gl.shaderSource(fragShader, frag);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(fragShader) || "compileShader failed");
    }
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "linkProgram failed");
    }
    return program;
}
export function initPrograms() {
    {
        const vert = "resources/glsl/text.vert.sk";
        const frag = "resources/glsl/text.frag.sk";
        const vertText = texts.get(vert);
        if (!vertText) throw new Error("vertText not loaded");
        const fragText = texts.get(frag);
        if (!fragText) throw new Error("fragText not loaded");
        const program = createShaderProgram(vertText, fragText);
        context.textProgram = program;
    }
    {
        const vert = "resources/glsl/sprite.vert.sk";
        const frag = "resources/glsl/sprite.frag.sk";
        const vertText = texts.get(vert);
        if (!vertText) throw new Error("vertText not loaded");
        const fragText = texts.get(frag);
        if (!fragText) throw new Error("fragText not loaded");
        const program = createShaderProgram(vertText, fragText);
        context.spriteProgram = program;
    }
}
export function initDrawobjects() {

    context.textDrawobject = createDrawobject(context.textProgram, [context.textTexture]);
    context.spriteDrawobject = createDrawobject(context.spriteProgram, []);
}
export function initContext(device: Device) {
    device.onKeyDown = (key) => context.keyboard.add(key);
    device.onKeyUp = (key) => context.keyboard.delete(key);
    context.device = device;
    context.gl = device.getCanvasGL().getContext('webgl2', {});

}

export function initWindow(width: number, height: number, title: string) {
    const { gl, device } = context;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, device.getCanvasGL().width, device.getCanvasGL().height);

}
export function beginDrawing() {
    const { device, gl } = context;
    const now = device.now();
    context.frameTime = (now - context.time) / 1000;
    context.fps = Math.floor(1 / context.frameTime);
    context.time = now;


}
export function endDrawing() {
}

export function clearBackground(color: vec4) {
    const { gl } = context;
    gl.clearColor(color[0], color[1], color[2], color[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
export function drawFPS(x: number, y: number) {
    drawText(`FPS: ${context.fps}`, x, y, 20, BLUE);
}
let text: MTSDFText = null!
export function drawText(content: string, x: number, y: number, size: number, color: vec4) {
    const { gl, fontData, textDrawobject, device } = context;
    const { vao, vboPosition: vbo, vboTexcoord: vbo1, ebo, textures, program } = textDrawobject;
    let mtsdfText = cacheMTSDFText(content, fontData, size);
    mtsdfText.update({text: content});
    const positions = mtsdfText.buffers.position;
    const texcoords = mtsdfText.buffers.uv;
    const indices = mtsdfText.buffers.index;
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    const posLoc = cacheAttributeLocation(gl, program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 4 * 3, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo1);
    gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.DYNAMIC_DRAW);
    const texcoordLoc = cacheAttributeLocation(gl, program, "a_texcoord");
    gl.enableVertexAttribArray(texcoordLoc);
    gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 4 * 2, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
    for (let i = 0; i < textures.length; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, textures[i].tex);
        gl.uniform1i(cacheUniformLocation(gl, program, `u_texture${i}`), i);
    }
    gl.uniform4fv(cacheUniformLocation(gl, program, "u_color"), color);
    gl.uniformMatrix4fv(cacheUniformLocation(gl, program, "u_projection"), false, mat4.ortho(mat4.create(), 0, getScreenWidth(), getScreenHeight(), 0, -1, 1));
    gl.uniformMatrix4fv(cacheUniformLocation(gl, program, "u_modelView"), false, mat4.fromTranslation(mat4.create(), [x, y, 0]));
    gl.uniform2fv(cacheUniformLocation(gl, program, "u_unitRange"), [textures[0].width, textures[0].height]);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

}
const positions = new Float32Array([
    0, 0, 0,
    1, 0, 0,
    1, 1, 0,
    0, 1, 0
]);
const texcoords = new Float32Array([
    0, 0,
    1, 0,
    1, 1,
    0, 1
]);
const indices = new Uint16Array([
    0, 1, 2,
    0, 2, 3
]);
export function drawTexture(texture: Texture, x: number, y: number, color: vec4) {

    const { gl, spriteDrawobject, device } = context;
    const { vao, vboPosition: vbo, vboTexcoord: vbo1, ebo, textures, program } = spriteDrawobject;
    positions[3] = texture.width;
    positions[6] = texture.width;
    positions[7] = texture.height;
    positions[10] = texture.height;
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    const posLoc = cacheAttributeLocation(gl, program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 4 * 3, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo1);
    gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.DYNAMIC_DRAW);
    const texcoordLoc = cacheAttributeLocation(gl, program, "a_texcoord");
    gl.enableVertexAttribArray(texcoordLoc);
    gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 4 * 2, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture.tex);
    gl.uniform1i(cacheUniformLocation(gl, program, `u_texture0`), 0);
    gl.uniform4fv(cacheUniformLocation(gl, program, "u_color"), color);
    gl.uniformMatrix4fv(cacheUniformLocation(gl, program, "u_projection"), false, mat4.ortho(mat4.create(), 0, getScreenWidth(), getScreenHeight(), 0, -1, 1));
    gl.uniformMatrix4fv(cacheUniformLocation(gl, program, "u_modelView"), false, mat4.fromTranslation(mat4.create(), [x, y, 0]));

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

}
export function getFPS(): number {
    return context.fps;
}

export function getFrameTime(): number {
    return context.frameTime;
}
export function getScreenHeight(): number {
    return context.device.getWindowInfo().windowHeight
}
export function getScreenWidth(): number {
    return context.device.getWindowInfo().windowWidth
}
export function isKeyDown(key: KeyboardKey): boolean {
    return context.keyboard.has(key);
}
export function isKeyUp(key: KeyboardKey): boolean {
    return !context.keyboard.has(key);
}
export function loadTexture(url: string): Texture {
    const img = images.get(url);
    if (!img) throw new Error("image not found");
    return createTexture(img);
}

export type Texture = {
    tex: WebGLTexture;
    width: number;
    height: number;
}
export enum KeyboardKey {
    KEY_C = 67,
    KEY_DOWN = 40,
    KEY_LEFT = 37,
    KEY_RIGHT = 39,
    KEY_UP = 38,
}
export const BLUE = vec4.fromValues(0, 0, 1, 1);
export const RAYWHITE = vec4.fromValues(0.9, 0.9, 0.9, 1);