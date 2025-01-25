// To parse this data:
//
//   import { Convert, MTSDFFontData } from "./file";
//
//   const mTSDFFontData = Convert.toMTSDFFontData(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface MTSDFFontData {
    atlas:    Atlas;
    variants: Variant[];
}

export interface Atlas {
    type:                string;
    distanceRange:       number;
    distanceRangeMiddle: number;
    size:                number;
    width:               number;
    height:              number;
    yOrigin:             string;
}

export interface Variant {
    metrics: Metrics;
    glyphs:  Glyph[];
    kerning: any[];
}

export interface Glyph {
    unicode:      number;
    advance:      number;
    planeBounds?: Bounds;
    atlasBounds?: Bounds;
}

export interface Bounds {
    left:   number;
    bottom: number;
    right:  number;
    top:    number;
}

export interface Metrics {
    emSize:             number;
    lineHeight:         number;
    ascender:           number;
    descender:          number;
    underlineY:         number;
    underlineThickness: number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toMTSDFFontData(json: string): MTSDFFontData {
        return cast(JSON.parse(json), r("MTSDFFontData"));
    }

    public static mTSDFFontDataToJson(value: MTSDFFontData): string {
        return JSON.stringify(uncast(value, r("MTSDFFontData")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "MTSDFFontData": o([
        { json: "atlas", js: "atlas", typ: r("Atlas") },
        { json: "variants", js: "variants", typ: a(r("Variant")) },
    ], false),
    "Atlas": o([
        { json: "type", js: "type", typ: "" },
        { json: "distanceRange", js: "distanceRange", typ: 0 },
        { json: "distanceRangeMiddle", js: "distanceRangeMiddle", typ: 0 },
        { json: "size", js: "size", typ: 0 },
        { json: "width", js: "width", typ: 0 },
        { json: "height", js: "height", typ: 0 },
        { json: "yOrigin", js: "yOrigin", typ: "" },
    ], false),
    "Variant": o([
        { json: "metrics", js: "metrics", typ: r("Metrics") },
        { json: "glyphs", js: "glyphs", typ: a(r("Glyph")) },
        { json: "kerning", js: "kerning", typ: a("any") },
    ], false),
    "Glyph": o([
        { json: "unicode", js: "unicode", typ: 0 },
        { json: "advance", js: "advance", typ: 3.14 },
        { json: "planeBounds", js: "planeBounds", typ: u(undefined, r("Bounds")) },
        { json: "atlasBounds", js: "atlasBounds", typ: u(undefined, r("Bounds")) },
    ], false),
    "Bounds": o([
        { json: "left", js: "left", typ: 3.14 },
        { json: "bottom", js: "bottom", typ: 3.14 },
        { json: "right", js: "right", typ: 3.14 },
        { json: "top", js: "top", typ: 3.14 },
    ], false),
    "Metrics": o([
        { json: "emSize", js: "emSize", typ: 0 },
        { json: "lineHeight", js: "lineHeight", typ: 3.14 },
        { json: "ascender", js: "ascender", typ: 3.14 },
        { json: "descender", js: "descender", typ: 3.14 },
        { json: "underlineY", js: "underlineY", typ: 3.14 },
        { json: "underlineThickness", js: "underlineThickness", typ: 3.14 },
    ], false),
};
