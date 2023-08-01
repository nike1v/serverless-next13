import { ApiManifest, ApiRoute, ExternalRoute, Manifest, PageManifest, PrerenderManifest, RedirectRoute, Request, Route, RoutesManifest, UnauthorizedRoute } from "../types";
export declare const handleAuth: (req: Request, manifest: Manifest) => UnauthorizedRoute | undefined;
export declare const handleDomainRedirects: (req: Request, manifest: Manifest) => RedirectRoute | undefined;
export declare const handleNextStaticFiles: (uri: string) => Route | undefined;
export declare const handlePublicFiles: (uri: string, manifest: Manifest) => Route | undefined;
export declare const routeApi: (req: Request, manifest: ApiManifest, routesManifest: RoutesManifest) => ApiRoute | ExternalRoute | RedirectRoute | UnauthorizedRoute | undefined;
export declare const routeDefault: (req: Request, manifest: PageManifest, prerenderManifest: PrerenderManifest, routesManifest: RoutesManifest) => Promise<Route>;
