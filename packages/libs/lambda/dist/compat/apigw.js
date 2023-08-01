"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpCompat = void 0;
const http_1 = require("http");
const querystring_1 = __importDefault(require("querystring"));
const stream_1 = require("stream");
/**
 * This is a compatibility later to replace req/res methods in order to bridge to APIGateway events.
 * @param event
 */
const httpCompat = (event) => {
    const response = {
        headers: {}
    };
    let tempResponseBody;
    const newStream = new stream_1.Stream.Readable();
    const req = Object.assign(newStream, http_1.IncomingMessage.prototype);
    const { queryStringParameters, rawPath } = event;
    const stage = event.requestContext.stage;
    // Need to remove the API Gateway stage in the normalized raw path
    let normalizedRawPath = rawPath.replace(`/${stage}`, "");
    normalizedRawPath = normalizedRawPath === "" ? "/" : normalizedRawPath;
    const qs = queryStringParameters
        ? querystring_1.default.stringify(queryStringParameters)
        : "";
    const hasQueryString = qs.length > 0;
    req.url = hasQueryString ? `${normalizedRawPath}?${qs}` : normalizedRawPath;
    req.method = event.requestContext.http.method;
    req.rawHeaders = [];
    req.headers = {};
    for (const [key, value] of Object.entries(event.headers)) {
        req.headers[key.toLowerCase()] = value;
    }
    req.getHeader = (name) => {
        return req.headers[name.toLowerCase()];
    };
    req.getHeaders = () => {
        return req.headers;
    };
    req.connection = {};
    const res = new stream_1.Stream();
    Object.defineProperty(res, "statusCode", {
        get() {
            return response.statusCode;
        },
        set(statusCode) {
            response.statusCode = statusCode;
        }
    });
    const headerNames = {};
    res.headers = {};
    res.writeHead = (status, headers) => {
        response.statusCode = status;
        res.headers = { ...res.headers, ...headers };
    };
    res.write = (chunk) => {
        // Use tempResponseBody to buffers until needed to convert to base64-encoded string for APIGateway response
        // Otherwise binary data (such as images) can get corrupted
        if (!tempResponseBody) {
            tempResponseBody = Buffer.from("");
        }
        tempResponseBody = Buffer.concat([
            tempResponseBody,
            Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        ]);
    };
    res.setHeader = (name, value) => {
        headerNames[name.toLowerCase()] = name;
        res.headers[name.toLowerCase()] = value;
    };
    res.removeHeader = (name) => {
        delete res.headers[name.toLowerCase()];
    };
    res.getHeader = (name) => {
        return res.headers[name.toLowerCase()];
    };
    res.getHeaders = () => {
        return res.headers;
    };
    res.hasHeader = (name) => {
        return !!res.getHeader(name);
    };
    const onResEnd = (resolve) => (text) => {
        if (text) {
            res.write(text);
        }
        if (!res.statusCode) {
            res.statusCode = 200;
        }
        if (tempResponseBody) {
            response.body = Buffer.from(tempResponseBody).toString("base64");
            response.isBase64Encoded = true;
        }
        res.writeHead(response.statusCode);
        response.headers = {};
        for (const [key, value] of Object.entries(res.headers)) {
            response.headers[headerNames[key] || key] = Array.isArray(value)
                ? value.join(",")
                : value;
        }
        resolve(response);
    };
    const responsePromise = new Promise((resolve) => {
        res.end = onResEnd(resolve);
    });
    if (event.body) {
        req.push(event.body, event.isBase64Encoded ? "base64" : undefined);
    }
    req.push(null);
    return { req, res, responsePromise };
};
exports.httpCompat = httpCompat;
