import { RedirectData } from "types";
/**
 * Whether this is the default trailing slash redirect.
 * This should only be used during build step to remove unneeded redirect paths.
 * @param redirect
 * @param basePath
 */
export declare function isTrailingSlashRedirect(redirect: RedirectData, basePath: string): boolean;
