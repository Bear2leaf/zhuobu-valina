import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import Device from "./device/Device";
import { Convert, MTSDFFontData } from "./mtsdf/MTSDFFontData";
import { MTSDFText } from "./mtsdf/MTSDFText";
import { pl_synth_init } from "./synth/pl_synth";
import getNormals from "polyline-normals"
const _attributeLocs: WeakMap<WebGLProgram, Record<string, number>> = new WeakMap();
const _uniformLocs: WeakMap<WebGLProgram, Record<string, WebGLUniformLocation>> = new WeakMap();
const _mtsdfTexts: Record<string, MTSDFText> = {};
type TextAlign = "left" | "center" | "right";
function cacheMTSDFText(content: string, fontData: MTSDFFontData, size: number, align: TextAlign): MTSDFText {
    const key = `${content}_${size}_${align}`;
    if (_mtsdfTexts[key] === undefined) {
        _mtsdfTexts[key] = new MTSDFText({ font: fontData, text: content, size, align });
    }
    return _mtsdfTexts[key];
}
const matStack: mat4[] = [mat4.identity(mat4.create())];
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
    audio: null! as AudioContext,
    synth: null! as ReturnType<typeof pl_synth_init>,
    gl: null! as WebGL2RenderingContext,
    time: 0,
    fps: 0,
    frameTime: 0,
    mouse: { x: 0, y: 0, left: false, right: false, middle: false, wheel: 0 },
    keyboard: new Set<number>(),
    textDrawobject: null! as Drawobject,
    spriteDrawobject: null! as Drawobject,
    lineDrawobject: null! as Drawobject,
    fontData: null! as MTSDFFontData,
    textProgram: null! as WebGLProgram,
    spriteProgram: null! as WebGLProgram,
    lineProgram: null! as WebGLProgram,
    textTexture: null! as Texture,
}

const images = new Map<string, HTMLImageElement>();
const texts = new Map<string, string>();
const buffers = new Map<string, ArrayBuffer>();

const musicNodes = new Map<string, WechatMinigame.BufferSourceNode>();
const audioBuffers = new Map<string, WechatMinigame.AudioBuffer>();
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
export async function addAudioBuffer(name: string, device: Device) {
    const buffer = await device.loadBuffer(`resources/${name}`);
    const ctx = device.createWebAudioContext();
    await new Promise((resolve, reject) => {
        ctx.decodeAudioData(buffer, (buffer) => {
            audioBuffers.set(name, buffer);
            resolve(null);
        }, (e) => {
            console.error(e);
            reject(e);
        });
    });



}
export async function addImage(name: string, device: Device) {
    images.set(name, await device.loadImage(`resources/${name}.png`));
}
export async function addBuffer(name: string, device: Device) {
    buffers.set(name, await device.loadBuffer(`resources/${name}`));
}
export async function addText(name: string, device: Device) {
    texts.set(name, await device.loadText(`resources/${name}`));
}
function createTexture(img: HTMLImageElement): Texture {
    const { gl } = context;
    const texture = gl.createTexture();
    if (!texture) throw new Error("createTexture failed");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
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

export function blit(texture: Texture | null, x: number, y: number, color = WHITE, center = false) {
    if (!texture) {
        throw new Error("Texture is not loaded");
    }
    drawTexture(texture, { x: 0, y: 0, width: texture.width, height: texture.height }, { x: center ? x - texture.width / 2 : x, y: center ? y - texture.height / 2 : y, width: texture.width, height: texture.height }, color, 0);
}
export function blitRectRect(texture: Texture | null, src: Rectangle, dest: Rectangle, color = WHITE, angle = 0) {
    if (!texture) {
        throw new Error("Texture is not loaded");
    }
    drawTexture(texture, src, dest, color, angle);
}
export function blitRect(texture: Texture | null, src: Rectangle, x: number, y: number, angle: number = 0, color = WHITE) {
    if (!texture) {
        throw new Error("Texture is not loaded");
    }
    drawTexture(texture, src, { x, y, width: src.width, height: src.height }, color, angle);
}
export function blitRotated(texture: Texture | null, x: number, y: number, angle: number, color = WHITE) {
    if (!texture) {
        throw new Error("Texture is not loaded");
    }
    drawTexture(texture, { x: 0, y: 0, width: texture.width, height: texture.height }, { x: x - texture.width / 2, y: y - texture.height / 2, width: texture.width, height: texture.height }, color, angle);
}
export enum BlendMode {
    None,
    Add,
}
export function setBlendMode(mode: BlendMode) {
    const { gl } = context;
    switch (mode) {
        case BlendMode.None:
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            break;
        case BlendMode.Add:
            gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
            break;
    }
}

export function initPrograms() {
    {
        const vert = "glsl/text.vert.sk";
        const frag = "glsl/text.frag.sk";
        const vertText = texts.get(vert);
        if (!vertText) throw new Error("vertText not loaded");
        const fragText = texts.get(frag);
        if (!fragText) throw new Error("fragText not loaded");
        const program = createShaderProgram(vertText, fragText);
        context.textProgram = program;
    }
    {
        const vert = "glsl/sprite.vert.sk";
        const frag = "glsl/sprite.frag.sk";
        const vertText = texts.get(vert);
        if (!vertText) throw new Error("vertText not loaded");
        const fragText = texts.get(frag);
        if (!fragText) throw new Error("fragText not loaded");
        const program = createShaderProgram(vertText, fragText);
        context.spriteProgram = program;
    }
    {
        const vert = "glsl/color.vert.sk";
        const frag = "glsl/color.frag.sk";
        const vertText = texts.get(vert);
        if (!vertText) throw new Error("vertText not loaded");
        const fragText = texts.get(frag);
        if (!fragText) throw new Error("fragText not loaded");
        const program = createShaderProgram(vertText, fragText);
        context.lineProgram = program;
    }
}
export function initDrawobjects() {

    context.textDrawobject = createDrawobject(context.textProgram, [context.textTexture]);
    context.spriteDrawobject = createDrawobject(context.spriteProgram, []);
    context.lineDrawobject = createDrawobject(context.lineProgram, []);
}
export function initContext(device: Device) {
    device.onKeyDown = (key) => context.keyboard.add(key);
    device.onKeyUp = (key) => context.keyboard.delete(key);
    device.onMouseMove = (x, y) => {
        context.mouse.x = x;
        context.mouse.y = y;
    }
    device.onMouseDown = (button) => {
        switch (button) {
            case 0:
                context.mouse.left = true;
                break;
            case 1:
                context.mouse.middle = true;
                break;
            case 2:
                context.mouse.right = true;
                break;
        }
    }
    device.onMouseUp = (button) => {
        switch (button) {
            case 0:
                context.mouse.left = false;
                break;
            case 1:
                context.mouse.middle = false;
                break;
            case 2:
                context.mouse.right = false;
                break;
        }
    }
    device.onMouseMove = (x, y) => {
        context.mouse.x = x;
        context.mouse.y = y;
    }
    device.onMouseWheel = (delta) => {
        context.mouse.wheel += delta;
    }
    context.device = device;
    context.gl = device.getCanvasGL().getContext('webgl2', {}) as WebGL2RenderingContext;
    const image = images.get(`font/NotoSansSC-Regular`);
    if (!image) throw new Error("image not found");
    context.textTexture = createTexture(image);
    const fontDataText = texts.get(`font/NotoSansSC-Regular.json`);
    if (!fontDataText) throw new Error("fontDataText not loaded");
    context.fontData = Convert.toMTSDFFontData(fontDataText);

}
export function rand() {
    return Math.floor(Math.random() * (-1 >>> 0));
}
export function initWindow(width: number, height: number, title: string) {
    const { gl, device } = context;
    gl.viewport(0, 0, device.getCanvasGL().width, device.getCanvasGL().height);
    gl.scissor(0, 0, device.getCanvasGL().width, device.getCanvasGL().height);
    gl.enable(gl.BLEND);
    gl.enable(gl.SCISSOR_TEST);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

}
export function initAudio() {
    const ctx = context.device.createWebAudioContext();
    context.audio = ctx;
    context.synth = pl_synth_init(ctx);
}
export function createFrameBuffer(width: number, height: number): Framebuffer {
    const { gl } = context;
    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error("createFramebuffer failed");
    const tex = gl.createTexture();
    if (!tex) throw new Error("createTexture failed");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, texture: { tex, width, height } };
}
export function beginFramebuffer(framebuffer: Framebuffer) {
    const { gl } = context;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.fbo);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.viewport(0, 0, framebuffer.texture.width, framebuffer.texture.height);
    gl.scissor(0, 0, framebuffer.texture.width, framebuffer.texture.height);
    fboWidth = framebuffer.texture.width;
    fboHeight = framebuffer.texture.height;
}
export function endFramebuffer() {
    const { gl, device } = context;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.viewport(0, 0, device.getCanvasGL().width, device.getCanvasGL().height);
    gl.scissor(0, 0, device.getCanvasGL().width, device.getCanvasGL().height);
    fboWidth = 0;
    fboHeight = 0;
}
export function beginDrawing() {
    const { device, gl } = context;
    const now = device.now();
    context.frameTime = (now - context.time) / 1000;
    context.fps = Math.floor(1 / context.frameTime);
    context.time = now;
    lineCount = 0;
    linePositions.fill(0);
    lineColors.fill(0);
    lineIndices.fill(0);
}
export function endDrawing() {
    context.mouse.wheel = 0;
    flushLines();
}

export function clearBackground(color: vec4) {
    const { gl } = context;
    gl.clearColor(color[0] / 255, color[1] / 255, color[2] / 255, color[3] / 255);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
}
export function drawFPS(x: number, y: number) {
    drawText(`FPS: ${context.fps}`, x, y, 20, BLUE);
}
let text: MTSDFText = null!
export function drawText(content: string, x: number, y: number, size: number, color: vec4, align: TextAlign = "left") {
    const { gl, fontData, textDrawobject, device } = context;
    const { vao, vboPosition: vbo, vboTexcoord: vbo1, ebo, textures, program } = textDrawobject;
    let mtsdfText = cacheMTSDFText(content, fontData, size, align);
    mtsdfText.update({ text: content });
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
    gl.uniform4fv(cacheUniformLocation(gl, program, "u_color"), vec4.scale(c, color, 1 / 255));
    gl.uniformMatrix4fv(cacheUniformLocation(gl, program, "u_projection"), false, mat4.ortho(m, 0, getScreenWidth(), getScreenHeight(), 0, -1, 1));
    gl.uniformMatrix4fv(cacheUniformLocation(gl, program, "u_modelView"), false, mat4.multiply(m, getCurrentMatrix(), mat4.fromTranslation(m, [x, y, 0])));
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
const linePositions = new Float32Array(3 * 4 * 500);
const lineColors = new Float32Array(4 * 4 * 500);
const lineIndices = new Uint16Array(6 * 500);
let lineCount = 0;
export function drawTexture(texture: Texture, src: Rectangle, dest: Rectangle, color: vec4, angle: number) {

    const { gl, spriteDrawobject, device } = context;
    const { vao, vboPosition: vbo, vboTexcoord: vbo1, ebo, textures, program } = spriteDrawobject;
    const center = vec2.fromValues(dest.x + dest.width / 2, dest.y + dest.height / 2);
    const p0 = vec2.fromValues(dest.x, dest.y);
    const p1 = vec2.fromValues(dest.x + dest.width, dest.y);
    const p2 = vec2.fromValues(dest.x + dest.width, dest.y + dest.height);
    const p3 = vec2.fromValues(dest.x, dest.y + dest.height);
    vec2.rotate(p0, p0, center, angle);
    vec2.rotate(p1, p1, center, angle);
    vec2.rotate(p2, p2, center, angle);
    vec2.rotate(p3, p3, center, angle);
    positions[0] = p0[0];
    positions[1] = p0[1];
    positions[3] = p1[0];
    positions[4] = p1[1];
    positions[6] = p2[0];
    positions[7] = p2[1];
    positions[9] = p3[0];
    positions[10] = p3[1];




    texcoords[0] = src.x / texture.width;
    texcoords[1] = src.y / texture.height;
    texcoords[2] = (src.x + src.width) / texture.width;
    texcoords[3] = src.y / texture.height;
    texcoords[4] = (src.x + src.width) / texture.width;
    texcoords[5] = (src.y + src.height) / texture.height;
    texcoords[6] = src.x / texture.width;
    texcoords[7] = (src.y + src.height) / texture.height;
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
    gl.uniform4fv(cacheUniformLocation(gl, program, "u_color"), vec4.scale(c, color, 1 / 255));
    gl.uniformMatrix4fv(cacheUniformLocation(gl, program, "u_projection"), false, mat4.ortho(m, 0, getScreenWidth(), getScreenHeight(), 0, -1, 1));
    gl.uniformMatrix4fv(cacheUniformLocation(gl, program, "u_modelView"), false, getCurrentMatrix());

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

}
export function pushMatrix() {
    const current = mat4.identity(mat4.create());
    const prev = getCurrentMatrix();
    mat4.multiply(current, prev, current);
    matStack.push(current);
}
export function popMatrix() {
    matStack.pop();
}
export function matTranslate(x: number, y: number, z: number) {
    if (matStack.length === 0) throw new Error("no matrix");
    mat4.translate(matStack[matStack.length - 1], matStack[matStack.length - 1], [x, y, z]);
}
export function matScale(x: number, y: number, z: number) {
    if (matStack.length === 0) throw new Error("no matrix");
    mat4.scale(matStack[matStack.length - 1], matStack[matStack.length - 1], [x, y, z]);
}
export function matRotateZ(angle: number) {
    if (matStack.length === 0) throw new Error("no matrix");
    mat4.rotateZ(matStack[matStack.length - 1], matStack[matStack.length - 1], angle);
}
function getCurrentMatrix() {
    return matStack[matStack.length - 1];
}
const c = vec4.create();
const m = mat4.create();

export function drawPolyLines(points: vec2[], color: vec4, thickness = 1) {
    const { gl, lineDrawobject } = context;
    const normals = getNormals(points.map(p => [p[0], p[1]]));
    const positions = new Float32Array(normals.reduce<number[]>((acc, n, i) => {
        const p = points[i];
        acc.push(p[0] + n[0][0] * thickness / 2 * n[1], p[1] + n[0][1] * thickness / 2 * n[1], 0);
        acc.push(p[0] - n[0][0] * thickness / 2 * n[1], p[1] - n[0][1] * thickness / 2 * n[1], 0);
        return acc;
    }, []));
    const colors = new Float32Array(positions.length / 3 * 4);
    colors.fill(1);
    const indices = new Uint16Array((points.length - 1) * 6);
    for (let i = 0; i < points.length - 1; i++) {
        const k = i * 6;
        const j = i * 2;
        indices[k + 0] = j + 0;
        indices[k + 1] = j + 1;
        indices[k + 2] = j + 2;
        indices[k + 3] = j + 2;
        indices[k + 4] = j + 1;
        indices[k + 5] = j + 3;
    }
    const { vao, vboPosition: vbo, vboTexcoord: vbo1, ebo, textures, program } = lineDrawobject;
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    const posLoc = cacheAttributeLocation(gl, program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 4 * 3, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo1);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    const colorLoc = cacheAttributeLocation(gl, program, "a_color");
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 4 * 4, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
    gl.uniform4fv(cacheUniformLocation(gl, program, "u_color"), vec4.scale(vec4.create(), color, 1 / 255));
    gl.uniformMatrix4fv(cacheUniformLocation(gl, program, "u_projection"), false, mat4.ortho(m, 0, getScreenWidth(), getScreenHeight(), 0, -1, 1));
    gl.uniformMatrix4fv(cacheUniformLocation(gl, program, "u_modelView"), false, getCurrentMatrix());
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

}

export function drawLine(x1: number, y1: number, x2: number, y2: number, color: vec4, thickness = 1) {
    const i = lineCount * 4 * 3;
    const normals = getNormals([[x1, y1], [x2, y2]]);
    linePositions[i + 0] = x1 + normals[0][0][0] * thickness / 2 * normals[0][1];
    linePositions[i + 1] = y1 + normals[0][0][1] * thickness / 2 * normals[0][1];
    linePositions[i + 2] = 0;
    linePositions[i + 3] = x1 - normals[0][0][0] * thickness / 2 * normals[0][1];
    linePositions[i + 4] = y1 - normals[0][0][1] * thickness / 2 * normals[0][1];
    linePositions[i + 5] = 0;
    linePositions[i + 6] = x2 + normals[0][0][0] * thickness / 2 * normals[0][1];
    linePositions[i + 7] = y2 + normals[0][0][1] * thickness / 2 * normals[0][1];
    linePositions[i + 8] = 0;
    linePositions[i + 9] = x2 - normals[0][0][0] * thickness / 2 * normals[0][1];
    linePositions[i + 10] = y2 - normals[0][0][1] * thickness / 2 * normals[0][1];
    linePositions[i + 11] = 0;
    const j = lineCount * 4 * 4;
    lineColors[j + 0] = color[0] / 255;
    lineColors[j + 1] = color[1] / 255;
    lineColors[j + 2] = color[2] / 255;
    lineColors[j + 3] = color[3] / 255;
    lineColors[j + 4] = color[0] / 255;
    lineColors[j + 5] = color[1] / 255;
    lineColors[j + 6] = color[2] / 255;
    lineColors[j + 7] = color[3] / 255;
    lineColors[j + 8] = color[0] / 255;
    lineColors[j + 9] = color[1] / 255;
    lineColors[j + 10] = color[2] / 255;
    lineColors[j + 11] = color[3] / 255;
    lineColors[j + 12] = color[0] / 255;
    lineColors[j + 13] = color[1] / 255;
    lineColors[j + 14] = color[2] / 255;
    lineColors[j + 15] = color[3] / 255;
    const k = lineCount * 6;
    lineIndices[k + 0] = lineCount * 4 + 0;
    lineIndices[k + 1] = lineCount * 4 + 1;
    lineIndices[k + 2] = lineCount * 4 + 2;
    lineIndices[k + 3] = lineCount * 4 + 2;
    lineIndices[k + 4] = lineCount * 4 + 1;
    lineIndices[k + 5] = lineCount * 4 + 3;
    /**
     * 0........1
     * .        .
     * .        .
     * 3........2
     */

    lineCount++;

}
function flushLines() {
    const { gl, lineDrawobject } = context;
    const { vao, vboPosition: vbo, vboTexcoord: vbo1, ebo, textures, program } = lineDrawobject;
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, linePositions, gl.DYNAMIC_DRAW);
    const posLoc = cacheAttributeLocation(gl, program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 4 * 3, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo1);
    gl.bufferData(gl.ARRAY_BUFFER, lineColors, gl.DYNAMIC_DRAW);
    const colorLoc = cacheAttributeLocation(gl, program, "a_color");
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 4 * 4, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lineIndices, gl.DYNAMIC_DRAW);
    gl.uniform4fv(cacheUniformLocation(gl, program, "u_color"), vec4.scale(c, WHITE, 1 / 255));
    gl.uniformMatrix4fv(cacheUniformLocation(gl, program, "u_projection"), false, mat4.ortho(m, 0, getScreenWidth(), getScreenHeight(), 0, -1, 1));
    gl.uniformMatrix4fv(cacheUniformLocation(gl, program, "u_modelView"), false, getCurrentMatrix());
    gl.drawElements(gl.TRIANGLES, lineIndices.length, gl.UNSIGNED_SHORT, 0);
}
export function getFPS(): number {
    return Math.floor(context.fps);
}
export function getTime(): number {
    return context.time;
}

export function getFrameTime(): number {
    return context.frameTime;
}
let fboWidth = 0;
let fboHeight = 0;
export function getScreenHeight(): number {
    return fboHeight || context.device.getWindowInfo().windowHeight
}
export function getScreenWidth(): number {
    return fboWidth || context.device.getWindowInfo().windowWidth
}
export function isKeyDown(key: KeyboardKey): boolean {
    return context.keyboard.has(key);
}
export function isKeyUp(key: KeyboardKey): boolean {
    return !context.keyboard.has(key);
}
export function loadText(name: string): string {
    const text = texts.get(name);
    if (!text) throw new Error("text not found");
    return text;
}
export function loadTexture(url: string): Texture {
    const img = images.get(url);
    if (!img) throw new Error("image not found: " + url);
    return createTexture(img);
}
export function loadSound(name: string) {
    const ctx = context.audio;
    const synth = context.synth;
    const [instrument, note] = name.split("#");
    audioBuffers.set(name, synth.sound(instrument.split(",").map(o => parseInt(o ? o : "0"), 10), note ? parseInt(note) : undefined));
}
export function getMouse() {
    return {
        x: context.mouse.x,
        y: context.mouse.y,
        left: context.mouse.left,
        right: context.mouse.right,
        middle: context.mouse.middle,
        wheel: context.mouse.wheel,
    }
}
export function playMusic(name: string) {
    const { audio } = context;
    const buffer = audioBuffers.get(`music/${name}`);
    if (!buffer) throw new Error("buffer not found");
    const old = musicNodes.get(name);
    if (old) {
        old.stop();
        old.disconnect();
    }
    const node = audio.createBufferSource();
    node.buffer = buffer;
    musicNodes.set(name, node);
    node.loop = true;
    node.connect(audio.destination);
    node.start();
    context.audio.resume();
}
export function playSound(name: string) {
    const { audio } = context;
    const buffer = audioBuffers.get(name);
    if (!buffer) throw new Error("buffer not found");
    const node = audio.createBufferSource();
    node.buffer = buffer;
    const gain = audio.createGain();
    gain.gain.value = 0.5;
    node.connect(gain);
    gain.connect(audio.destination);
    node.start();
}
export function stopMusic(name: string) {
    const node = musicNodes.get(name);
    if (node) {
        node.stop();
        musicNodes.delete(name);
    }
}
export type Rectangle = {
    x: number;
    y: number;
    width: number;
    height: number;
    rotated?: boolean;
}
export type Framebuffer = {
    texture: Texture;
    fbo: WebGLFramebuffer;
}
export type Texture = {
    tex: WebGLTexture;
    width: number;
    height: number;
}
export enum KeyboardKey {
    KEY_C = 67,
    KEY_K = 75,
    KEY_DOWN = 40,
    KEY_LEFT = 37,
    KEY_RIGHT = 39,
    KEY_UP = 38,
    KEY_W = 87,
    KEY_I = 73,
    KEY_A = 65,
    KEY_S = 83,
    KEY_D = 68,
    KEY_SPACE = 32,
}
export const YELLOW = vec4.fromValues(255, 255, 0, 255);
export const BLUE = vec4.fromValues(0, 0, 255, 255);
export const GREEN = vec4.fromValues(0, 255, 0, 255);
export const BLACK = vec4.fromValues(0, 0, 0, 255);
export const TRANSPARENT = vec4.fromValues(0, 0, 0, 0);
export const RAYWHITE = vec4.fromValues(245, 245, 245, 255);
export const WHITE = vec4.fromValues(255, 255, 255, 255);
export const RED = vec4.fromValues(255, 0, 0, 255);
export const LIGHTBLUE = vec4.fromValues(128, 192, 255, 255);  