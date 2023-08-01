import { PageManifest, Request, RoutesManifest } from "../types";
/**
 * Get the rewrite of the given path, if it exists.
 * @param uri
 * @param pageManifest
 * @param routesManifest
 */
export declare function getRewritePath(req: Request, uri: string, routesManifest: RoutesManifest, pageManifest?: PageManifest): string | undefined;
export declare function isExternalRewrite(customRewrite: string): boolean;
