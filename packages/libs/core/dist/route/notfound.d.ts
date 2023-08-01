import { DataRoute, PageManifest, PageRoute, RoutesManifest, StaticRoute } from "../types";
export declare const staticNotFound: (uri: string, manifest: PageManifest, routesManifest: RoutesManifest) => (StaticRoute & PageRoute) | undefined;
export declare const notFoundData: (uri: string, manifest: PageManifest, routesManifest: RoutesManifest) => DataRoute | StaticRoute;
export declare const notFoundPage: (uri: string, manifest: PageManifest, routesManifest: RoutesManifest) => PageRoute;
