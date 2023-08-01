import { PageManifest, RoutesManifest } from "../types";
export declare const usedSSR: (manifest: PageManifest, routesManifest: RoutesManifest) => {
    dynamic: {
        [key: string]: string;
    };
    nonDynamic: {
        [key: string]: string;
    };
};
