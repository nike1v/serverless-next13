import { Manifest, Request, RedirectRoute, RoutesManifest } from "../types";
/**
 * Create a redirect response with the given status code
 * @param uri
 * @param querystring
 * @param statusCode
 */
export declare function createRedirectResponse(uri: string, querystring: string | undefined, statusCode: number): RedirectRoute;
/**
 * Get a domain redirect such as redirecting www to non-www domain.
 * @param request
 * @param manifest
 */
export declare function getDomainRedirectPath(request: Request, manifest: Manifest): string | undefined;
/**
 * Redirect from root to locale.
 * @param req
 * @param routesManifest
 * @param manifest
 */
export declare function getLanguageRedirectPath(req: Request, manifest: Manifest, routesManifest: RoutesManifest): Promise<string | undefined>;
/**
 * Get the redirect of the given path, if it exists.
 * @param request
 * @param routesManifest
 */
export declare function getRedirectPath(request: Request, routesManifest: RoutesManifest): {
    path: string;
    statusCode: number;
} | null;
/**
 * Get a domain redirect such as redirecting www to non-www domain.
 * @param request
 * @param manifest
 */
export declare function getTrailingSlashPath(request: Request, manifest: Manifest, isFile: boolean): string | undefined;
