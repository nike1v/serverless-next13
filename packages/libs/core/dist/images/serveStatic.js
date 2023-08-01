"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExtension = exports.getContentType = void 0;
const send_1 = __importDefault(require("send"));
function getContentType(extWithoutDot) {
    const { mime } = send_1.default;
    if ("getType" in mime) {
        // 2.0
        // @ts-ignore
        return mime.getType(extWithoutDot);
    }
    // 1.0
    return mime.lookup(extWithoutDot);
}
exports.getContentType = getContentType;
function getExtension(contentType) {
    const { mime } = send_1.default;
    if ("getExtension" in mime) {
        // 2.0
        // @ts-ignore
        return mime.getExtension(contentType);
    }
    // 1.0
    return mime.extension(contentType);
}
exports.getExtension = getExtension;
