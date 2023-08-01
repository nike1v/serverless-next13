import { parse } from "cookie";
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
export const isValidPreviewRequest = async (cookies, previewModeSigningKey) => {
    const previewCookies = getPreviewCookies(cookies);
    if (hasPreviewCookies(previewCookies)) {
        try {
            const jsonwebtoken = await import("jsonwebtoken");
            jsonwebtoken.verify(previewCookies[NEXT_PREVIEW_DATA_COOKIE], previewModeSigningKey);
            return true;
        }
        catch (e) {
            console.warn("Found preview headers without valid authentication token");
        }
    }
    return false;
};
// Private
const getPreviewCookies = (cookies) => {
    const targetCookie = cookies || [];
    return targetCookie.reduce((previewCookies, cookieObj) => {
        const parsedCookie = parse(cookieObj.value);
        if (hasPreviewCookies(parsedCookie)) {
            return parsedCookie;
        }
        return previewCookies;
    }, defaultPreviewCookies);
};
const hasPreviewCookies = (cookies) => !!(cookies[NEXT_PREVIEW_DATA_COOKIE] && cookies[NEXT_PRERENDER_BYPASS_COOKIE]);
