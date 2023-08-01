"use strict";
/**
 * This and related code are adapted from https://github.com/vercel/next.js/blob/48acc479f3befb70de800392315831ed7defa4d8/packages/next/next-server/server/image-optimizer.ts
 * The MIT License (MIT)

 Copyright (c) 2020 Vercel, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageOptimizer = exports.normaliseUri = exports.getMaxAge = void 0;
const accept_1 = require("@hapi/accept");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const fs_1 = require("fs");
// @ts-ignore no types for is-animated
const is_animated_1 = __importDefault(require("is-animated"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const path_1 = require("path");
const imageConfig_1 = require("./imageConfig");
const sendEtagResponse_1 = require("./sendEtagResponse");
const serveStatic_1 = require("./serveStatic");
let sharp;
const AVIF = "image/avif";
const WEBP = "image/webp";
const PNG = "image/png";
const JPEG = "image/jpeg";
const GIF = "image/gif";
const SVG = "image/svg+xml";
const CACHE_VERSION = 2;
const ANIMATABLE_TYPES = [WEBP, PNG, GIF];
const VECTOR_TYPES = [SVG];
function parseCacheControl(str) {
    const map = new Map();
    if (!str) {
        return map;
    }
    for (const directive of str.split(",")) {
        let [key, value] = directive.trim().split("=");
        key = key.toLowerCase();
        if (value) {
            value = value.toLowerCase();
        }
        map.set(key, value);
    }
    return map;
}
function getMaxAge(str) {
    const minimum = 60;
    const map = parseCacheControl(str);
    if (map) {
        let age = map.get("s-maxage") || map.get("max-age") || "";
        if (age.startsWith('"') && age.endsWith('"')) {
            age = age.slice(1, -1);
        }
        const n = parseInt(age, 10);
        if (!isNaN(n)) {
            return Math.max(n, minimum);
        }
    }
    return minimum;
}
exports.getMaxAge = getMaxAge;
/**
 * If Basepath set, it needs to be removed from URL
 *
 * Not normalised -> error 403
 * url: '<base-path>/assets/images/logo.svg',
 *
 * Normalised -> 200
 * url: '/assets/images/logo.svg',
 */
function normaliseUri(uri, basePath) {
    if (uri.startsWith(basePath)) {
        uri = uri.slice(basePath.length);
    }
    return uri;
}
exports.normaliseUri = normaliseUri;
async function imageOptimizer(basePath, imagesManifest, req, res, parsedUrl, platformClient) {
    var _a, _b, _c, _d;
    const imageConfig = (_a = imagesManifest === null || imagesManifest === void 0 ? void 0 : imagesManifest.images) !== null && _a !== void 0 ? _a : imageConfig_1.imageConfigDefault;
    const { deviceSizes = [], imageSizes = [], domains = [], formats = ["image/webp"], loader } = imageConfig;
    const sizes = [...deviceSizes, ...imageSizes];
    if (loader !== "default") {
        res.statusCode = 404;
        res.end("default loader not found");
        return { finished: true };
    }
    const { headers } = req;
    const { url, w, q } = parsedUrl.query;
    const mimeType = getSupportedMimeType(formats, headers.accept);
    let href;
    if (!url) {
        res.statusCode = 400;
        res.end('"url" parameter is required');
        return { finished: true };
    }
    else if (Array.isArray(url)) {
        res.statusCode = 400;
        res.end('"url" parameter cannot be an array');
        return { finished: true };
    }
    let isAbsolute;
    if (url.startsWith("/")) {
        // Ensure that Basepath is in the URL, otherwise, a 400 is triggered (same behaviour as Nextjs)
        if (basePath !== "/" && !url.startsWith(basePath)) {
            res.statusCode = 400;
            res.end('"Basepath" set but not added to the URL');
            return { finished: true };
        }
        href = normaliseUri(url, basePath);
        isAbsolute = false;
    }
    else {
        let hrefParsed;
        try {
            hrefParsed = new URL(url);
            href = hrefParsed.toString();
            isAbsolute = true;
        }
        catch (_error) {
            res.statusCode = 400;
            res.end('"url" parameter is invalid');
            return { finished: true };
        }
        if (!["http:", "https:"].includes(hrefParsed.protocol)) {
            res.statusCode = 400;
            res.end('"url" parameter is invalid');
            return { finished: true };
        }
        if (!domains.includes(hrefParsed.hostname)) {
            res.statusCode = 400;
            res.end('"url" parameter is not allowed');
            return { finished: true };
        }
    }
    if (!w) {
        res.statusCode = 400;
        res.end('"w" parameter (width) is required');
        return { finished: true };
    }
    else if (Array.isArray(w)) {
        res.statusCode = 400;
        res.end('"w" parameter (width) cannot be an array');
        return { finished: true };
    }
    if (!q) {
        res.statusCode = 400;
        res.end('"q" parameter (quality) is required');
        return { finished: true };
    }
    else if (Array.isArray(q)) {
        res.statusCode = 400;
        res.end('"q" parameter (quality) cannot be an array');
        return { finished: true };
    }
    const width = parseInt(w, 10);
    if (!width || isNaN(width)) {
        res.statusCode = 400;
        res.end('"w" parameter (width) must be a number greater than 0');
        return { finished: true };
    }
    if (!sizes.includes(width)) {
        res.statusCode = 400;
        res.end(`"w" parameter (width) of ${width} is not allowed`);
        return { finished: true };
    }
    const quality = parseInt(q);
    if (isNaN(quality) || quality < 1 || quality > 100) {
        res.statusCode = 400;
        res.end('"q" parameter (quality) must be a number between 1 and 100');
        return { finished: true };
    }
    const hash = getHash([CACHE_VERSION, href, width, quality, mimeType]);
    const imagesDir = (0, path_1.join)("/tmp", "cache", "images"); // Use Lambda tmp directory
    const imagesMetaDir = (0, path_1.join)("/tmp", "cache", "imageMeta");
    const hashDir = (0, path_1.join)(imagesDir, hash);
    const metaDir = (0, path_1.join)(imagesMetaDir, hash);
    const now = Date.now();
    if (fs.existsSync(hashDir)) {
        const files = await fs_1.promises.readdir(hashDir);
        for (const file of files) {
            const [prefix, etag, extension] = file.split(".");
            const expireAt = Number(prefix);
            const contentType = (0, serveStatic_1.getContentType)(extension);
            const fsPath = (0, path_1.join)(hashDir, file);
            if (now < expireAt) {
                const meta = JSON.parse((await fs_1.promises.readFile((0, path_1.join)(metaDir, `${file}.json`))).toString());
                if (!res.getHeader("Cache-Control")) {
                    if (meta.headers["Cache-Control"]) {
                        res.setHeader("Cache-Control", meta.headers["Cache-Control"]);
                    }
                    else {
                        res.setHeader("Cache-Control", "public, max-age=60");
                    }
                }
                if ((0, sendEtagResponse_1.sendEtagResponse)(req, res, etag)) {
                    return { finished: true };
                }
                if (contentType) {
                    res.setHeader("Content-Type", contentType);
                }
                (0, fs_1.createReadStream)(fsPath).pipe(res);
                return { finished: true };
            }
            else {
                await fs_1.promises.unlink(fsPath);
            }
        }
    }
    let upstreamBuffer;
    let upstreamType;
    let maxAge;
    let cacheControl;
    if (isAbsolute) {
        const upstreamRes = await (0, node_fetch_1.default)(href);
        if (!upstreamRes.ok) {
            res.statusCode = upstreamRes.status;
            res.end('"url" parameter is valid but upstream response is invalid');
            return { finished: true };
        }
        res.statusCode = upstreamRes.status;
        upstreamBuffer = Buffer.from(await upstreamRes.arrayBuffer());
        upstreamType = (_b = upstreamRes.headers.get("Content-Type")) !== null && _b !== void 0 ? _b : undefined;
        cacheControl = upstreamRes.headers.get("Cache-Control");
        maxAge = getMaxAge(cacheControl !== null && cacheControl !== void 0 ? cacheControl : undefined);
        if (cacheControl) {
            res.setHeader("Cache-Control", cacheControl);
        }
    }
    else {
        let objectKey;
        try {
            // note: basepath is already removed by URI normalization above
            if (href.startsWith(`/static`) || href.startsWith(`/_next/static`)) {
                objectKey = `${basePath}${href}`; // static files' URL map to the key prefixed with basepath e.g /static/ -> static
            }
            else {
                objectKey = `${basePath}/public` + href; // public file URLs map from /public.png -> public/public.png
            }
            // Remove leading slash from object key
            if (objectKey.startsWith("/")) {
                objectKey = objectKey.slice(1);
            }
            const response = await platformClient.getObject(objectKey);
            res.statusCode = response.statusCode;
            upstreamBuffer = (_c = response.body) !== null && _c !== void 0 ? _c : Buffer.of();
            upstreamType = (_d = response.contentType) !== null && _d !== void 0 ? _d : undefined;
            cacheControl = response.cacheControl;
            maxAge = getMaxAge(response.cacheControl);
            // If object response provides cache control header, use that
            if (response.cacheControl) {
                res.setHeader("Cache-Control", response.cacheControl);
            }
        }
        catch (err) {
            res.statusCode = 500;
            res.end('"url" parameter is valid but upstream response is invalid');
            console.error(`Error processing upstream response due to error for key: ${objectKey}. Stack trace: ` +
                err.stack);
            return { finished: true };
        }
    }
    if (upstreamType) {
        const vector = VECTOR_TYPES.includes(upstreamType);
        const animate = ANIMATABLE_TYPES.includes(upstreamType) && (0, is_animated_1.default)(upstreamBuffer);
        if (vector || animate) {
            sendResponse(req, res, upstreamType, upstreamBuffer);
            return { finished: true };
        }
    }
    const expireAt = maxAge * 1000 + now;
    let contentType;
    if (mimeType) {
        contentType = mimeType;
    }
    else if ((upstreamType === null || upstreamType === void 0 ? void 0 : upstreamType.startsWith("image/")) && (0, serveStatic_1.getExtension)(upstreamType)) {
        contentType = upstreamType;
    }
    else {
        contentType = JPEG;
    }
    if (!sharp) {
        try {
            sharp = require("sharp");
        }
        catch (error) {
            if (error.code === "MODULE_NOT_FOUND") {
                error.message += "\n\nLearn more: https://err.sh/next.js/install-sharp";
                console.error(error.stack);
                sendResponse(req, res, upstreamType, upstreamBuffer);
                return { finished: true };
            }
            throw error;
        }
    }
    try {
        const transformer = sharp(upstreamBuffer);
        transformer.rotate(); // auto rotate based on EXIF data
        const { width: metaWidth } = await transformer.metadata();
        if (metaWidth && metaWidth > width) {
            transformer.resize(width);
        }
        if (contentType === AVIF) {
            transformer.avif({ quality });
        }
        else if (contentType === WEBP) {
            transformer.webp({ quality });
        }
        else if (contentType === PNG) {
            transformer.png({ quality });
        }
        else if (contentType === JPEG) {
            transformer.jpeg({ quality });
        }
        const optimizedBuffer = await transformer.toBuffer();
        await Promise.all([
            fs_1.promises.mkdir(hashDir, { recursive: true }),
            fs_1.promises.mkdir(metaDir, { recursive: true })
        ]);
        const extension = (0, serveStatic_1.getExtension)(contentType);
        const etag = getHash([optimizedBuffer]);
        const fileName = `${expireAt}.${etag}.${extension}`;
        const filePath = (0, path_1.join)(hashDir, fileName);
        const metaFilename = (0, path_1.join)(metaDir, `${fileName}.json`);
        await Promise.all([
            fs_1.promises.writeFile(filePath, optimizedBuffer),
            fs_1.promises.writeFile(metaFilename, JSON.stringify({ headers: { "Cache-Control": cacheControl } }))
        ]);
        sendResponse(req, res, contentType, optimizedBuffer);
    }
    catch (error) {
        console.error("Error processing image with sharp, returning upstream image as fallback instead: " +
            error.stack);
        sendResponse(req, res, upstreamType, upstreamBuffer);
    }
    return { finished: true };
}
exports.imageOptimizer = imageOptimizer;
function sendResponse(req, res, contentType, buffer) {
    const etag = getHash([buffer]);
    if (!res.getHeader("Cache-Control")) {
        res.setHeader("Cache-Control", "public, max-age=60");
    }
    if ((0, sendEtagResponse_1.sendEtagResponse)(req, res, etag)) {
        return;
    }
    if (contentType) {
        res.setHeader("Content-Type", contentType);
    }
    res.end(buffer);
}
function getSupportedMimeType(options, accept = "") {
    const mimeType = (0, accept_1.mediaType)(accept, options);
    return accept.includes(mimeType) ? mimeType : "";
}
function getHash(items) {
    const hash = (0, crypto_1.createHash)("sha256");
    for (const item of items) {
        if (typeof item === "number")
            hash.update(String(item));
        else {
            hash.update(item);
        }
    }
    // See https://en.wikipedia.org/wiki/Base64#Filenames
    return hash.digest("base64").replace(/\//g, "-");
}
