import { Manifest, Request, RoutesManifest } from "../types";
export declare const findDomainLocale: (req: Request, manifest: RoutesManifest) => string | null;
export declare function addDefaultLocaleToPath(path: string, routesManifest: RoutesManifest, forceLocale?: string | null): string;
export declare function dropLocaleFromPath(path: string, routesManifest: RoutesManifest): string;
export declare const getAcceptLanguageLocale: (acceptLanguage: string, manifest: Manifest, routesManifest: RoutesManifest) => Promise<string | undefined>;
export declare function getLocalePrefixFromUri(uri: string, routesManifest: RoutesManifest): string;
/**
 * Get a redirect to the locale-specific domain. Returns undefined if no redirect found.
 * @param req
 * @param routesManifest
 */
export declare function getLocaleDomainRedirect(req: Request, routesManifest: RoutesManifest): Promise<string | undefined>;
