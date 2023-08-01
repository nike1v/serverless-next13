"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getThrottledStaticRegenerationCachePolicy = exports.getStaticRegenerationResponse = void 0;
const firstRegenerateExpiryDate = (lastModifiedHeader, initialRevalidateSeconds) => {
    return new Date(new Date(lastModifiedHeader).getTime() + initialRevalidateSeconds * 1000);
};
/**
 * Function called within an origin response as part of the Incremental Static
 * Regeneration logic. Returns required headers for the response, or false if
 * this response is not compatible with ISR.
 */
const getStaticRegenerationResponse = (options) => {
    const { initialRevalidateSeconds } = options;
    // ISR pages that were either previously regenerated or generated
    // post-initial-build, will have an `Expires` header set. However ISR pages
    // that have not been regenerated but at build-time resolved a revalidate
    // property will not have an `Expires` header and therefore we check using the
    // manifest.
    if (!options.expiresHeader &&
        !(options.lastModifiedHeader && typeof initialRevalidateSeconds === "number")) {
        return false;
    }
    const expiresAt = options.expiresHeader
        ? new Date(options.expiresHeader)
        : firstRegenerateExpiryDate(options.lastModifiedHeader, initialRevalidateSeconds);
    const secondsRemainingUntilRevalidation = Math.ceil(Math.max(0, (expiresAt.getTime() - Date.now()) / 1000));
    return {
        secondsRemainingUntilRevalidation,
        cacheControl: `public, max-age=0, s-maxage=${secondsRemainingUntilRevalidation}, must-revalidate`
    };
};
exports.getStaticRegenerationResponse = getStaticRegenerationResponse;
const getThrottledStaticRegenerationCachePolicy = (expiresInSeconds) => {
    return {
        secondsRemainingUntilRevalidation: expiresInSeconds,
        cacheControl: `public, max-age=0, s-maxage=${expiresInSeconds}, must-revalidate`
    };
};
exports.getThrottledStaticRegenerationCachePolicy = getThrottledStaticRegenerationCachePolicy;
