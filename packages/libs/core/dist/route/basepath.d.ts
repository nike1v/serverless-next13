import { RoutesManifest } from "../types";
export declare const normalise: (uri: string, routesManifest: RoutesManifest) => {
    normalisedUri: string;
    missingExpectedBasePath: boolean;
};
