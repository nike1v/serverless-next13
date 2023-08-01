"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultHandler = void 0;
const index_1 = require("./index");
const perf_hooks_1 = require("perf_hooks");
const redirect_1 = require("./route/redirect");
const redirect_2 = require("./handle/redirect");
const node_fetch_1 = __importDefault(require("node-fetch"));
const perfLogger = (logLambdaExecutionTimes) => {
    if (logLambdaExecutionTimes) {
        return {
            now: () => perf_hooks_1.performance.now(),
            log: (metricDescription, t1, t2) => {
                if (!t1 || !t2) {
                    return;
                }
                console.log(`${metricDescription}: ${t2 - t1} (ms)`);
            }
        };
    }
    return {
        now: () => 0,
        log: () => {
            // intentionally empty
        }
    };
};
const createExternalRewriteResponse = async (customRewrite, req, res, platformClient, body) => {
    // Set request headers
    const reqHeaders = {};
    Object.assign(reqHeaders, req.headers);
    // Delete host header otherwise request may fail due to host mismatch
    if (reqHeaders.hasOwnProperty("host")) {
        delete reqHeaders.host;
    }
    let fetchResponse;
    if (body) {
        const decodedBody = Buffer.from(body, "base64").toString("utf8");
        fetchResponse = await (0, node_fetch_1.default)(customRewrite, {
            headers: reqHeaders,
            method: req.method,
            body: decodedBody,
            compress: false,
            redirect: "manual"
        });
    }
    else {
        fetchResponse = await (0, node_fetch_1.default)(customRewrite, {
            headers: reqHeaders,
            method: req.method,
            compress: false,
            redirect: "manual"
        });
    }
    for (const [name, val] of fetchResponse.headers.entries()) {
        res.setHeader(name, val);
    }
    res.statusCode = fetchResponse.status;
    res.end(await fetchResponse.buffer());
};
const externalRewrite = async (req, res, rewrite, platformClient) => {
    var _a, _b;
    const querystring = ((_a = req.url) === null || _a === void 0 ? void 0 : _a.includes("?")) ? (_b = req.url) === null || _b === void 0 ? void 0 : _b.split("?") : "";
    let body = "";
    req.on("data", (chunk) => {
        body += chunk.toString();
    });
    await createExternalRewriteResponse(rewrite + (querystring ? "?" : "") + querystring, req, res, platformClient, body);
};
const staticRequest = async (req, res, responsePromise, file, path, route, manifest, routesManifest, platformClient) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const basePath = routesManifest.basePath;
    const fileKey = (path + decodeURI(file)).slice(1); // need to remove leading slash from path for page/file key
    // also decode file parameter as it's encoded
    // (legacy reasons since previously Cloudfront request is used to request S3, and CF requires an encoded request.uri)
    const staticRoute = route.isStatic ? route : undefined;
    const statusCode = (_a = route === null || route === void 0 ? void 0 : route.statusCode) !== null && _a !== void 0 ? _a : 200;
    // For PUT, DELETE, PATCH, POST just return the page as this is a static page, so HTTP method doesn't really do anything.
    // For OPTIONS, we should not return the content but instead return allowed methods.
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            Allow: "OPTIONS, GET, HEAD, POST, PUT, PATCH, DELETE"
        });
        res.end();
        return await responsePromise;
    }
    // Get file/page response by calling the platform's client
    const fileResponse = await platformClient.getObject(fileKey);
    // These 403/404 statuses are returned when the object store does not have access to the page or page is not found in the store.
    // Thus, we may need to return a fallback in those cases.
    // Normally status code is 200 otherwise.
    // TODO: we may also want to handle other unexpected status codes (5xx etc.) such as by rendering an error page from the handler itself.
    if (fileResponse.statusCode !== 403 && fileResponse.statusCode !== 404) {
        let cacheControl = fileResponse.headers["Cache-Control"];
        // If these are error pages, then just return them
        if (statusCode === 404 || statusCode === 500) {
            cacheControl =
                statusCode === 500
                    ? "public, max-age=0, s-maxage=0, must-revalidate"
                    : cacheControl;
        }
        else {
            // Otherwise we may need to do static regeneration
            const staticRegenerationResponse = (0, index_1.getStaticRegenerationResponse)({
                expiresHeader: (_c = (_b = fileResponse.expires) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : "",
                lastModifiedHeader: (_e = (_d = fileResponse.lastModified) === null || _d === void 0 ? void 0 : _d.toString()) !== null && _e !== void 0 ? _e : "",
                initialRevalidateSeconds: staticRoute === null || staticRoute === void 0 ? void 0 : staticRoute.revalidate
            });
            if (staticRegenerationResponse) {
                cacheControl = staticRegenerationResponse.cacheControl;
                if ((staticRoute === null || staticRoute === void 0 ? void 0 : staticRoute.page) &&
                    staticRegenerationResponse.secondsRemainingUntilRevalidation === 0) {
                    if (!req.url) {
                        throw new Error("Request url is unexpectedly undefined");
                    }
                    const { throttle } = await platformClient.triggerStaticRegeneration({
                        basePath,
                        eTag: fileResponse.headers.ETag,
                        lastModified: fileResponse.lastModified,
                        pagePath: staticRoute.page,
                        pageKey: fileKey,
                        req
                    });
                    // Occasionally we will get rate-limited by the Queue (in the event we
                    // send it too many messages) and so we we use the cache to reduce
                    // requests to the queue for a short period.
                    if (throttle) {
                        cacheControl =
                            (0, index_1.getThrottledStaticRegenerationCachePolicy)(1).cacheControl;
                    }
                }
            }
        }
        // Get custom headers and convert it into a plain object
        const customHeaders = (0, index_1.getCustomHeaders)((_f = req.url) !== null && _f !== void 0 ? _f : "", routesManifest);
        const convertedCustomHeaders = {};
        for (const key in customHeaders) {
            convertedCustomHeaders[key] = customHeaders[key][0].value;
        }
        const headers = {
            ...fileResponse.headers,
            "Cache-Control": cacheControl,
            ...convertedCustomHeaders
        };
        res.writeHead(statusCode, headers);
        res.end(fileResponse.body);
        return await responsePromise;
    }
    const getPage = (pagePath) => {
        return require(`./${pagePath}`);
    };
    const fallbackRoute = await (0, index_1.handleFallback)({ req, res, responsePromise }, route, manifest, routesManifest, getPage);
    // Already handled dynamic error path
    if (!fallbackRoute) {
        return await responsePromise;
    }
    // Either a fallback: true page or a static error page
    if (fallbackRoute.isStatic) {
        const file = fallbackRoute.file.slice("pages".length);
        const normalizedBasePath = basePath
            ? `${basePath.replace(/^\//, "")}/`
            : "";
        const pageKey = `${normalizedBasePath}static-pages/${manifest.buildId}${file}`;
        const pageResponse = await platformClient.getObject(pageKey);
        const statusCode = (_g = fallbackRoute.statusCode) !== null && _g !== void 0 ? _g : 200;
        const is500 = statusCode === 500;
        const cacheControl = is500
            ? "public, max-age=0, s-maxage=0, must-revalidate" // static 500 page should never be cached
            : (_h = pageResponse.cacheControl) !== null && _h !== void 0 ? _h : (fallbackRoute.fallback // Use cache-control from object response if possible, otherwise use defaults
                ? "public, max-age=0, s-maxage=0, must-revalidate" // fallback should never be cached
                : "public, max-age=0, s-maxage=2678400, must-revalidate");
        res.writeHead(statusCode, {
            "Cache-Control": cacheControl,
            "Content-Type": "text/html"
        });
        res.end(pageResponse.body);
        return await responsePromise;
    }
    // This is a fallback route that should be stored in object store before returning it
    const { renderOpts, html } = fallbackRoute;
    // Check if response is a redirect
    if (typeof renderOpts.pageData !== "undefined" &&
        typeof renderOpts.pageData.pageProps !== "undefined" &&
        typeof renderOpts.pageData.pageProps.__N_REDIRECT !== "undefined") {
        const statusCode = renderOpts.pageData.pageProps.__N_REDIRECT_STATUS;
        const redirectPath = renderOpts.pageData.pageProps.__N_REDIRECT;
        const redirectResponse = (0, redirect_1.createRedirectResponse)(redirectPath, route.querystring, statusCode);
        (0, redirect_2.redirect)({ req, res, responsePromise }, redirectResponse);
        return await responsePromise;
    }
    const { expires } = await platformClient.storePage({
        html,
        uri: file,
        basePath,
        buildId: manifest.buildId,
        pageData: renderOpts.pageData,
        revalidate: renderOpts.revalidate
    });
    const isrResponse = expires
        ? (0, index_1.getStaticRegenerationResponse)({
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
/**
 * Platform-agnostic handler that handles all pages (SSR, SSG, and API) and public files.
 * It requires passing a platform client which will implement methods for retrieving/storing pages, and triggering static regeneration.
 * @param req
 * @param res
 * @param responsePromise
 * @param manifest
 * @param prerenderManifest
 * @param routesManifest
 * @param options
 * @param platformClient
 */
const defaultHandler = async ({ req, res, responsePromise, manifest, prerenderManifest, routesManifest, options, platformClient }) => {
    const { now, log } = perfLogger(options.logExecutionTimes);
    let tBeforeSSR = null;
    const getPage = (pagePath) => {
        const tBeforePageRequire = now();
        const page = require(`./${pagePath}`); // eslint-disable-line
        const tAfterPageRequire = (tBeforeSSR = now());
        log("Require JS execution time", tBeforePageRequire, tAfterPageRequire);
        return page;
    };
    const route = await (0, index_1.handleDefault)({ req, res, responsePromise }, manifest, prerenderManifest, routesManifest, getPage);
    if (tBeforeSSR) {
        const tAfterSSR = now();
        log("SSR execution time", tBeforeSSR, tAfterSSR);
    }
    if (!route) {
        return await responsePromise;
    }
    if (route.isPublicFile) {
        const { file } = route;
        return await staticRequest(req, res, responsePromise, file, `${routesManifest.basePath}/public`, route, manifest, routesManifest, platformClient);
    }
    if (route.isNextStaticFile) {
        const { file } = route;
        const relativeFile = file.slice("/_next/static".length);
        return await staticRequest(req, res, responsePromise, relativeFile, `${routesManifest.basePath}/_next/static`, route, manifest, routesManifest, platformClient);
    }
    if (route.isStatic) {
        const { file, isData } = route;
        const path = isData
            ? `${routesManifest.basePath}`
            : `${routesManifest.basePath}/static-pages/${manifest.buildId}`;
        const relativeFile = isData ? file : file.slice("pages".length);
        return await staticRequest(req, res, responsePromise, relativeFile, path, route, manifest, routesManifest, platformClient);
    }
    const external = route;
    const { path } = external;
    return await externalRewrite(req, res, path, platformClient);
};
exports.defaultHandler = defaultHandler;
