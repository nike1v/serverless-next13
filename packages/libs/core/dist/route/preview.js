"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPreviewRequest = void 0;
const cookie_1 = require("cookie");
const NEXT_PREVIEW_DATA_COOKIE = "__next_preview_data";
const NEXT_PRERENDER_BYPASS_COOKIE = "__prerender_bypass";
const defaultPreviewCookies = {
    [NEXT_PRERENDER_BYPASS_COOKIE]: "",
    [NEXT_PREVIEW_DATA_COOKIE]: ""
};
/**
 * Determine if the request contains a valid signed JWT for preview mode
 *
 * @param cookies - Cookies header with cookies in RFC 6265 compliant format
 * @param previewModeSigningKey - Next build key generated in the preRenderManifest
 */
const isValidPreviewRequest = async (cookies, previewModeSigningKey) => {
    const previewCookies = getPreviewCookies(cookies);
    if (hasPreviewCookies(previewCookies)) {
        try {
            const jsonwebtoken = await Promise.resolve().then(() => __importStar(require("jsonwebtoken")));
            jsonwebtoken.verify(previewCookies[NEXT_PREVIEW_DATA_COOKIE], previewModeSigningKey);
            return true;
        }
        catch (e) {
            console.warn("Found preview headers without valid authentication token");
        }
    }
    return false;
};
exports.isValidPreviewRequest = isValidPreviewRequest;
// Private
const getPreviewCookies = (cookies) => {
    const targetCookie = cookies || [];
    return targetCookie.reduce((previewCookies, cookieObj) => {
        const parsedCookie = (0, cookie_1.parse)(cookieObj.value);
        if (hasPreviewCookies(parsedCookie)) {
            return parsedCookie;
        }
        return previewCookies;
    }, defaultPreviewCookies);
};
const hasPreviewCookies = (cookies) => !!(cookies[NEXT_PREVIEW_DATA_COOKIE] && cookies[NEXT_PRERENDER_BYPASS_COOKIE]);
