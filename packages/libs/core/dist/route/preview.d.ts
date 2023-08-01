export type Cookies = {
    key?: string | undefined;
    value: string;
}[];
/**
 * Determine if the request contains a valid signed JWT for preview mode
 *
 * @param cookies - Cookies header with cookies in RFC 6265 compliant format
 * @param previewModeSigningKey - Next build key generated in the preRenderManifest
 */
export declare const isValidPreviewRequest: (cookies: Cookies, previewModeSigningKey: string) => Promise<boolean>;
