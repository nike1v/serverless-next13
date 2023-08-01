import { DataRoute, PageManifest, RoutesManifest, StaticRoute } from "../types";
export declare const handleDataReq: (uri: string, manifest: PageManifest, routesManifest: RoutesManifest, isPreview: boolean) => DataRoute | StaticRoute;
