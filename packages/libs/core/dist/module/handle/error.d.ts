import { Event, PageManifest, RoutesManifest, StaticRoute } from "../types";
export declare const renderErrorPage: (error: any, event: Event, route: {
    page: string;
    isData: boolean;
}, manifest: PageManifest, routesManifest: RoutesManifest, getPage: (page: string) => any) => Promise<void | StaticRoute>;
