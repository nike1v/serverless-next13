"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEtagResponse = void 0;
const fresh_1 = __importDefault(require("fresh"));
function sendEtagResponse(req, res, etag) {
    if (etag) {
        /**
         * The server generating a 304 response MUST generate any of the
         * following header fields that would have been sent in a 200 (OK)
         * response to the same request: Cache-Control, Content-Location, Date,
         * ETag, Expires, and Vary. https://tools.ietf.org/html/rfc7232#section-4.1
         */
        res.setHeader("ETag", `"${etag}"`);
    }
    if ((0, fresh_1.default)(req.headers, { etag: `"${etag}"` })) {
        res.statusCode = 304;
        res.end();
        return true;
    }
    return false;
}
exports.sendEtagResponse = sendEtagResponse;
