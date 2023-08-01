import { ExternalRoute, PageManifest, PageRoute, RoutesManifest, Request, ApiRoute } from "../types";
export declare const handlePageReq: (req: Request, uri: string, manifest: PageManifest, routesManifest: RoutesManifest, isPreview: boolean, isRewrite?: boolean) => ExternalRoute | PageRoute | ApiRoute;
