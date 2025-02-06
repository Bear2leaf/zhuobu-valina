import { Glyph, MTSDFFontData } from "./MTSDFFontData";
type TextOptions = {
    font: MTSDFFontData;
    text: string;
    width?: number;
    align?: "left" | "center" | "right";
    size?: number;
    letterSpacing?: number;
    lineHeight?: number;
    wordSpacing?: number;
    wordBreak?: boolean;
};
type Line = { width: number; glyphs: [Glyph, number][]; }
type Buffers = { id: Float32Array, position: Float32Array, uv: Float32Array, index: Uint16Array }
const buffers = {
    position: new Float32Array(100 * 4 * 3),
    uv: new Float32Array(100 * 4 * 2),
    id: new Float32Array(100 * 4),
    index: new Uint16Array(100 * 6),
};
export class MTSDFText {
    private _buffers?: Buffers;
    private _numLines?: number;
    private _height?: number;
    size: number;
    readonly distanceRange: readonly [number, number];
    get buffers(): Buffers {
        if (!this._buffers) {
            throw new Error('Buffers not created yet');
        }
        return this._buffers;
    }
    get numLines(): number {
        if (!this._numLines) {
            throw new Error('Buffers not created yet');
        }
        return this._numLines;

    }
    get height(): number {
        if (!this._height) {
            throw new Error('Buffers not created yet');
        }
        return this._height;

    }
    width: number = Infinity;

    private _resize?: (options: TextOptions) => void;
    private _update?: (options: { text: string }) => void;
    get resize() {
        if (!this._resize) {
            throw new Error('Resize not implemented');
        }
        return this._resize;
    }
    get update() {
        if (!this._update) {
            throw new Error('Update not implemented');
        }
        return this._update;
    }
    constructor({
        font,
        text,
        width = Infinity,
        align = 'left',
        size = 1,
        letterSpacing = 0,
        lineHeight = 1.4,
        wordSpacing = 0,
        wordBreak = false,
    }: TextOptions) {
        this.size = size;
        const _this = this;
        let glyphs: Record<string, Glyph>;
        let scale: number;

        this.distanceRange = [font.atlas.distanceRange / font.atlas.width, font.atlas.distanceRange / font.atlas.height];
        const newline = /\n/;
        const whitespace = /\s/;

        {
            parseFont();
            createGeometry();
        }
        function parseFont() {
            glyphs = {};
            font.variants.forEach((v) => v.glyphs.forEach((d) => (glyphs[String.fromCharCode(d.unicode)] = d)));
        }

        function createGeometry() {

            // Use baseline so that actual text height is as close to 'size' value as possible
            scale = size;

            // Strip spaces and newlines to get actual character length for buffers
            // let chars = text.replace(/[ \n]/g, '');
            let chars = text;
            let numChars = chars.length;
            if (numChars > buffers.position.length / 3 / 4) {
                throw new Error('Text too long');
            }
            Object.keys(buffers).forEach((key) => {
                buffers[key as keyof Buffers].fill(0);
            })

            // Set values for buffers that don't require calculation
            for (let i = 0; i < numChars; i++) {
                buffers.id.set([i, i, i, i], i * 4);
                buffers.index.set([i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3], i * 6);
            }

            layout();
        }

        function layout() {
            const lines: Line[] = [];

            let cursor = 0;

            let wordCursor = 0;
            let wordWidth = 0;
            let line = newLine();

            function newLine() {
                const line: Line = {
                    width: 0,
                    glyphs: [],
                };
                lines.push(line);
                wordCursor = cursor;
                wordWidth = 0;
                return line;
            }

            let maxTimes = 100;
            let count = 0;
            while (cursor < text.length && count < maxTimes) {
                count++;

                const char = text[cursor];

                // Skip whitespace at start of line
                // if (!line.width && whitespace.test(char)) {
                //     cursor++;
                //     wordCursor = cursor;
                //     wordWidth = 0;
                //     continue;
                // }

                // If newline char, skip to next line
                if (newline.test(char)) {
                    cursor++;
                    line = newLine();
                    continue;
                }

                const glyph = glyphs[char] || glyphs[' '];

                // Find any applicable kern pairs
                if (line.glyphs.length) {
                    const prevGlyph = line.glyphs[line.glyphs.length - 1][0];
                    let kern = getKernPairOffset(glyph.unicode, prevGlyph.unicode) * scale;
                    line.width += kern;
                    wordWidth += kern;
                }

                // add char to line
                line.glyphs.push([glyph, line.width]);

                // calculate advance for next glyph
                let advance = 0;

                // If whitespace, update location of current word for line breaks
                if (whitespace.test(char)) {
                    wordCursor = cursor;
                    wordWidth = 0;

                    // Add wordspacing
                    advance += wordSpacing * size;
                } else {
                    // Add letterspacing
                    advance += letterSpacing * size;
                }

                advance += glyph.advance * scale;

                line.width += advance;
                wordWidth += advance;

                // If width defined
                if (line.width > width) {
                    // If can break words, undo latest glyph if line not empty and create new line
                    if (wordBreak && line.glyphs.length > 1) {
                        line.width -= advance;
                        line.glyphs.pop();
                        line = newLine();
                        continue;

                        // If not first word, undo current word and cursor and create new line
                    } else if (!wordBreak && wordWidth !== line.width) {
                        let numGlyphs = cursor - wordCursor + 1;
                        line.glyphs.splice(-numGlyphs, numGlyphs);
                        cursor = wordCursor;
                        line.width -= wordWidth;
                        line = newLine();
                        continue;
                    }
                }

                cursor++;
                // Reset infinite loop catch
                count = 0;
            }

            // Remove last line if empty
            if (!line.width) lines.pop();

            populateBuffers(lines);
        }

        function populateBuffers(lines: Line[]) {
            const texW = font.atlas.width;
            const texH = font.atlas.height;

            // For all fonts tested, a little offset was needed to be right on the baseline, hence 0.07.
            let y = size;
            let j = 0;

            for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                let line = lines[lineIndex];

                for (let i = 0; i < line.glyphs.length; i++) {
                    const glyph = line.glyphs[i][0];
                    let x = line.glyphs[i][1];

                    if (align === 'center') {
                        x -= line.width * 0.5;
                    } else if (align === 'right') {
                        x -= line.width;
                    }

                    // If space, don't add to geometry
                    if (whitespace.test(String.fromCharCode(glyph.unicode))) continue;

                    // Apply char sprite offsets
                    x += glyph.planeBounds!.left * scale;
                    y -= glyph.planeBounds!.top * scale;

                    // each letter is a quad. axis bottom left
                    let w = (glyph.planeBounds!.right - glyph.planeBounds!.left) * scale;
                    let h = (glyph.planeBounds!.bottom - glyph.planeBounds!.top) * scale;
                    buffers.position.set([x, y - h, 0, x, y, 0, x + w, y - h, 0, x + w, y, 0], j * 4 * 3);

                    let u = glyph.atlasBounds!.left / texW;
                    let uw = (glyph.atlasBounds!.right - glyph.atlasBounds!.left) / texW;
                    let v = 1.0 - glyph.atlasBounds!.top / texH;
                    let vh = (glyph.atlasBounds!.bottom - glyph.atlasBounds!.top) / texH;
                    buffers.uv.set([u, v - vh, u, v, u + uw, v - vh, u + uw, v], j * 4 * 2);

                    // Reset cursor to baseline
                    y += glyph.planeBounds!.top * scale;

                    j++;
                }

                y += size * lineHeight;
            }

            _this._buffers = buffers;
            _this._numLines = lines.length;
            _this._height = _this.numLines * size * lineHeight;
            _this.width = Math.max(...lines.map((line) => line.width));
        }

        function getKernPairOffset(id1: number, id2: number) {
            for (const variant of font.variants) {

                for (let i = 0; i < variant.kerning.length; i++) {
                    throw new Error('Not implemented');
                    let k = variant.kerning[i];
                    if (k.first < id1) continue;
                    if (k.second < id2) continue;
                    if (k.first > id1) return 0;
                    if (k.first === id1 && k.second > id2) return 0;
                    return k.amount;
                }
            }
            return 0;
        }

        // Update buffers to layout with new layout
        this._resize = function (options) {
            layout();
        };

        // Completely change text (like creating new Text)
        this._update = function (options) {
            ({ text } = options);
            createGeometry();
        };
    }
}