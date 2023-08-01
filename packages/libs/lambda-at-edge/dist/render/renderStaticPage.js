"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderStaticPage = void 0;
const core_1 = require("@sls-next/core");
const triggerStaticRegeneration_1 = require("../lib/triggerStaticRegeneration");
const s3StorePage_1 = require("../s3/s3StorePage");
const client_s3_1 = require("@aws-sdk/client-s3");
const get_stream_1 = __importDefault(require("get-stream"));
const renderStaticPage = async ({ route, request, req, res, responsePromise, manifest, routesManifest, bucketName, s3Key, s3Uri, basePath }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const staticRoute = route.isStatic ? route : undefined;
    const statusCode = (_a = route === null || route === void 0 ? void 0 : route.statusCode) !== null && _a !== void 0 ? _a : 200;
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            Allow: "OPTIONS, GET, HEAD, POST, PUT, PATCH, DELETE"
        });
        res.end();
        return await responsePromise;
    }
    const s3 = new client_s3_1.S3Client({
        region: (_c = (_b = request.origin) === null || _b === void 0 ? void 0 : _b.s3) === null || _c === void 0 ? void 0 : _c.region,
        maxAttempts: 3
    });
    const s3BasePath = basePath ? `${basePath.replace(/^\//, "")}/` : "";
    const s3Params = {
        Bucket: bucketName,
        Key: s3Key
    };
    let s3StatusCode;
    let bodyString;
    let s3Response;
    try {
        s3Response = await s3.send(new client_s3_1.GetObjectCommand(s3Params));
        bodyString = await (0, get_stream_1.default)(s3Response.Body);
        s3StatusCode = s3Response.$metadata.httpStatusCode;
    }
    catch (e) {
        s3StatusCode = e.$metadata.httpStatusCode;
    }
    if (s3Response && s3StatusCode !== 403 && s3StatusCode !== 404) {
        let cacheControl = s3Response.CacheControl;
        if (statusCode === 404 || statusCode === 500) {
            cacheControl =
                statusCode === 500
                    ? "public, max-age=0, s-maxage=0, must-revalidate"
                    : cacheControl;
        }
        else {
            const staticRegenerationResponse = (0, core_1.getStaticRegenerationResponse)({
                expiresHeader: (_e = (_d = s3Response.Expires) === null || _d === void 0 ? void 0 : _d.toString()) !== null && _e !== void 0 ? _e : "",
                lastModifiedHeader: (_g = (_f = s3Response.LastModified) === null || _f === void 0 ? void 0 : _f.toString()) !== null && _g !== void 0 ? _g : "",
                initialRevalidateSeconds: staticRoute === null || staticRoute === void 0 ? void 0 : staticRoute.revalidate
            });
            if (staticRegenerationResponse) {
                cacheControl = staticRegenerationResponse.cacheControl;
                if ((staticRoute === null || staticRoute === void 0 ? void 0 : staticRoute.page) &&
                    staticRegenerationResponse.secondsRemainingUntilRevalidation === 0) {
                    const regenerationQueueName = (_h = manifest.regenerationQueueName) !== null && _h !== void 0 ? _h : `${bucketName}.fifo`;
                    if (!regenerationQueueName) {
                        throw new Error("Regeneration queue name is undefined.");
                    }
                    const { throttle } = await (0, triggerStaticRegeneration_1.triggerStaticRegeneration)({
                        basePath,
                        request,
                        pageS3Path: s3Key,
                        eTag: s3Response.ETag,
                        lastModified: (_j = s3Response.LastModified) === null || _j === void 0 ? void 0 : _j.getTime().toString(),
                        pagePath: staticRoute.page,
                        queueName: regenerationQueueName
                    });
                    if (throttle) {
                        cacheControl =
                            (0, core_1.getThrottledStaticRegenerationCachePolicy)(1).cacheControl;
                    }
                }
            }
        }
        const customHeaders = (0, core_1.getCustomHeaders)(request.uri, routesManifest);
        const convertedCustomHeaders = {};
        for (const key in customHeaders) {
            convertedCustomHeaders[key] = customHeaders[key][0].value;
        }
        const headers = {
            "Cache-Control": cacheControl,
            "Content-Disposition": s3Response.ContentDisposition,
            "Content-Type": s3Response.ContentType,
            "Content-Language": s3Response.ContentLanguage,
            "Content-Length": s3Response.ContentLength,
            "Content-Encoding": s3Response.ContentEncoding,
            "Content-Range": s3Response.ContentRange,
            ETag: s3Response.ETag,
            LastModified: (_k = s3Response.LastModified) === null || _k === void 0 ? void 0 : _k.getTime().toString(),
            "Accept-Ranges": s3Response.AcceptRanges,
            ...convertedCustomHeaders
        };
        res.writeHead(statusCode, headers);
        res.end(bodyString);
        return await responsePromise;
    }
    const getPage = (pagePath) => {
        return require(`./${pagePath}`);
    };
    const fallbackRoute = await (0, core_1.handleFallback)({ req, res, responsePromise }, route, manifest, routesManifest, getPage);
    if (!fallbackRoute) {
        return await responsePromise;
    }
    if (fallbackRoute.isStatic) {
        const file = fallbackRoute.file.slice("pages".length);
        const s3Key = `${s3BasePath}static-pages/${manifest.buildId}${file}`;
        const s3Params = {
            Bucket: bucketName,
            Key: s3Key
        };
        const s3Response = await s3.send(new client_s3_1.GetObjectCommand(s3Params));
        const bodyString = await (0, get_stream_1.default)(s3Response.Body);
        const statusCode = fallbackRoute.statusCode || 200;
        const is500 = statusCode === 500;
        const cacheControl = is500
            ? "public, max-age=0, s-maxage=0, must-revalidate"
            : (_l = s3Response.CacheControl) !== null && _l !== void 0 ? _l : (fallbackRoute.fallback
                ? "public, max-age=0, s-maxage=0, must-revalidate"
                : "public, max-age=0, s-maxage=2678400, must-revalidate");
        res.writeHead(statusCode, {
            "Cache-Control": cacheControl,
            "Content-Type": "text/html"
        });
        res.end(bodyString);
        return await responsePromise;
    }
    const { renderOpts, html } = fallbackRoute;
    const { expires } = await (0, s3StorePage_1.s3StorePage)({
        html,
        uri: s3Uri,
        basePath,
        bucketName: bucketName || "",
        buildId: manifest.buildId,
        pageData: renderOpts.pageData,
        region: ((_o = (_m = request.origin) === null || _m === void 0 ? void 0 : _m.s3) === null || _o === void 0 ? void 0 : _o.region) || "",
        revalidate: renderOpts.revalidate
    });
    const isrResponse = expires
        ? (0, core_1.getStaticRegenerationResponse)({
            expiresHeader: expires.toJSON(),
            lastModifiedHeader: undefined,
            initialRevalidateSeconds: staticRoute === null || staticRoute === void 0 ? void 0 : staticRoute.revalidate
        })
        : null;
    const cacheControl = (isrResponse && isrResponse.cacheControl) ||
        "public, max-age=0, s-maxage=2678400, must-revalidate";
    res.setHeader("Cache-Control", cacheControl);
    if (fallbackRoute.route.isData) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(renderOpts.pageData));
    }
    else {
        res.setHeader("Content-Type", "text/html");
        res.end(html);
    }
    return await responsePromise;
};
exports.renderStaticPage = renderStaticPage;
