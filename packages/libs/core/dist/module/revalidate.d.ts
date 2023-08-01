interface StaticRegenerationResponseOptions {
    expiresHeader: string;
    lastModifiedHeader: string | undefined;
    initialRevalidateSeconds?: false | number;
}
interface StaticRegenerationResponseValue {
    cacheControl: string;
    secondsRemainingUntilRevalidation: number;
}
/**
 * Function called within an origin response as part of the Incremental Static
 * Regeneration logic. Returns required headers for the response, or false if
 * this response is not compatible with ISR.
 */
export declare const getStaticRegenerationResponse: (options: StaticRegenerationResponseOptions) => StaticRegenerationResponseValue | false;
export declare const getThrottledStaticRegenerationCachePolicy: (expiresInSeconds: number) => StaticRegenerationResponseValue;
export {};
