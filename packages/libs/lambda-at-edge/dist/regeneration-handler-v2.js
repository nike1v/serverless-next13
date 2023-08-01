"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const manifest_json_1 = __importDefault(require("./manifest.json"));
const aws_common_1 = require("@sls-next/aws-common");
const stream_1 = __importDefault(require("stream"));
const http_1 = __importDefault(require("http"));
const core_1 = require("@sls-next/core");
const handler = async (event) => {
    await Promise.all(event.Records.map(async (record) => {
        const regenerationEvent = JSON.parse(record.body);
        const manifest = manifest_json_1.default;
        const originalRequest = regenerationEvent.request;
        const req = Object.assign(new stream_1.default.Readable(), http_1.default.IncomingMessage.prototype);
        req.url = originalRequest.url;
        req.headers = originalRequest.headers;
        const res = Object.assign(new stream_1.default.Readable(), http_1.default.ServerResponse.prototype);
        const awsPlatformClient = new aws_common_1.AwsPlatformClient(regenerationEvent.storeName, regenerationEvent.storeRegion, undefined, undefined);
        await (0, core_1.regenerationHandler)({
            req,
            res,
            regenerationEvent,
            manifest,
            platformClient: awsPlatformClient
        });
    }));
};
exports.handler = handler;
