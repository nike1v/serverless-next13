import { ApiManifest, Event, ExternalRoute, RoutesManifest } from "../types";
export declare const handleApi: (event: Event, manifest: ApiManifest, routesManifest: RoutesManifest, getPage: (page: string) => any) => Promise<ExternalRoute | void>;
