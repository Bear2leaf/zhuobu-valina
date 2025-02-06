import { addImage, beginFramebuffer, blit, blitRect, blitRectRect, blitRotated, clearBackground, createFrameBuffer, endFramebuffer, loadTexture, Rectangle, Texture, TRANSPARENT, WHITE } from "../context";
import Device from "../device/Device";

type Node = {
    x: number;
    y: number;
    w: number;
    h: number;
} & ({
    used: true;
    child: [Node, Node];
} | {
    used: false;
    child: null;
});
export function findNode(root: Node, w: number, h: number, padding = 0): Node | null {
    if (root.used) {
        let n: Node | null = null;

        if ((n = findNode(root.child[0], w, h, padding)) || (n = findNode(root.child[1], w, h, padding))) {
            return n;
        }
    }
    else if (w <= root.w && h <= root.h) {
        splitNode(root, w, h, padding);

        return root;
    }

    return null;
}
export function splitNode(node: Node, w: number, h: number, padding: number) {
    node.used = true;

    node.child = [{
        x: node.x + w + padding,
        y: node.y,
        w: node.w - w - padding,
        h: h,
        used: false,
        child: null
    }, {
        x: node.x,
        y: node.y + h + padding,
        w: node.w,
        h: node.h - h - padding,
        used: false,
        child: null
    }]

}
export function initAtlas() {
    const dest: Rectangle = { x: 0, y: 0, width: 0, height: 0 };
    const padding = 1;
    const atlasSize = 128;

    const framebuffer = createFrameBuffer(atlasSize, atlasSize);
    beginFramebuffer(framebuffer);
    clearBackground(TRANSPARENT);
    const root: Node = {
        x: 0,
        y: 0,
        w: atlasSize,
        h: atlasSize,
        used: false,
        child: null
    }
    let n: Node | null = null;
    const images: (Texture & { filename: string })[] = [];
    for (const url of urls) {
        const texture = loadTexture(url);
        if (texture) {
            images.push({ ...texture, filename: url });
        }
    }
    images.sort((a, b) => b.height - a.height);
    for (const image of images) {
        let rotated = false;
        const w = image.width;
        const h = image.height;
        n = findNode(root, w, h, padding);
        if (!n) {
            rotated = true;
            n = findNode(root, h, w, padding);
        }
        if (n) {
            if (rotated) {
                n.h = w;
                n.w = h;
            }
            dest.x = n.x;
            dest.y = n.y;
            dest.width = n.w;
            dest.height = n.h;
            if (!rotated) {
                blit(image, dest.x, dest.y);
                dest.y = atlasSize - dest.y - h;
                dest.width = w;
                dest.height = h;
            } else {
                blitRotated(image, dest.x + dest.width / 2, dest.y + dest.height / 2, Math.PI / 2);
                dest.y = atlasSize - dest.y - w;
                dest.width = h;
                dest.height = w;
            }
            atlasData[image.filename] = {
                x: dest.x,
                y: dest.y,
                width: dest.width,
                height: dest.height,
                rotated
            }
        } else {
            throw new Error("Atlas is full");
        }

    }
    endFramebuffer();
    atlasTexture = framebuffer.texture;
}

const urls = new Set([
    "atlas/cubes/bigGreen",
    "atlas/cubes/bigGrey",
    "atlas/spheres/smallCyan",
    "atlas/spheres/smallGreen",
    "atlas/spheres/smallGrey",
    "atlas/spheres/smallRed",
    "atlas/tall/long",
    "atlas/tiles/1",
    "atlas/tiles/7",
]);
let atlasTexture: Texture | null = null;
const atlasData: Record<string, Rectangle> = {};

export async function addAtlas(device: Device) {

    for (const path of urls) {
        await addImage(path, device);
    }

}
type AtlasImage = readonly [Texture | null, Rectangle];
export function getAtlasImage(path: string): AtlasImage {
    return [atlasTexture, atlasData[path]];
}
export function blitAtlasImage(name: string, x: number, y: number, color = WHITE) {
    const [texture, atlasSrc] = getAtlasImage(name);
    const w = atlasSrc.width;
    const h = atlasSrc.height;
    const rotated = atlasSrc.rotated;
    const src: Rectangle = { x: atlasSrc.x, y: atlasSrc.y, width: w, height: h };
    const dx = x - (rotated ? (w - h) / 2 : 0);
    const dy = y - (rotated ? (h - w) / 2 : 0);
    blitRect(texture, src, dx, dy, (rotated ? Math.PI / 2 : 0), color);

}
export function blitAtlasImageScaled(name: string, x: number, y: number, sx: number, sy: number, color = WHITE) {
    const [texture, atlasSrc] = getAtlasImage(name);
    const w = atlasSrc.width;
    const h = atlasSrc.height;
    const rotated = atlasSrc.rotated;
    const src: Rectangle = { x: atlasSrc.x, y: atlasSrc.y, width: w, height: h };
    const dx = x - (rotated ? (sx - sy) / 2 : 0);
    const dy = y - (rotated ? (sy - sx) / 2 : 0);
    const dest: Rectangle = { x: dx, y: dy, width: sx, height: sy };
    blitRectRect(texture, src, dest, color, (rotated ? Math.PI / 2 : 0));

}

export function blitAtlasImageRotated(name: string, x: number, y: number, color = WHITE, angle: number = 0) {
    const [texture, atlasSrc] = getAtlasImage(name);
    const w = atlasSrc.width;
    const h = atlasSrc.height;
    const rotated = atlasSrc.rotated;
    const src: Rectangle = { x: atlasSrc.x, y: atlasSrc.y, width: w, height: h };
    const dx = x - (rotated ? (w - h) / 2 : (angle === 0 ? 0 : h / 2));
    const dy = y - (rotated ? (h - w) / 2 : (angle === 0 ? 0 : w / 2));
    blitRect(texture, src, dx, dy, angle * (Math.PI / 180) + (rotated ? Math.PI / 2 : 0), color);

}
