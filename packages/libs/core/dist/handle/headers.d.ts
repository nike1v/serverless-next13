import { Event, Headers, Route, RoutesManifest } from "../types";
export declare const getCustomHeaders: (uri: string, routesManifest: RoutesManifest) => Headers;
export declare const setCustomHeaders: (event: Event, routesManifest: RoutesManifest) => void;
export declare const setHeadersFromRoute: (event: Event, route: Route) => void;
