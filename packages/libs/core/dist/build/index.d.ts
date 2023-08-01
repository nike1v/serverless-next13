import { BuildOptions, NextConfig } from "./types";
import { ApiManifest, Manifest, PageManifest, RoutesManifest } from "../types";
import { PrerenderManifest } from "next/dist/build";
export declare const prepareBuildManifests: (buildOptions: BuildOptions, nextConfig: NextConfig | undefined, routesManifest: RoutesManifest, pagesManifest: {
    [key: string]: string;
}, prerenderManifest: PrerenderManifest, publicFiles: string[]) => Promise<{
    pageManifest: PageManifest;
    apiManifest: ApiManifest;
    imageManifest: Manifest;
}>;
export * from "./types";
