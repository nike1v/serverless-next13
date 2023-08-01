import { PreRenderedManifest as PrerenderManifestType } from "./types";
import { RoutesManifest } from "./index";
import { PageManifest } from "./types";
import { IncomingMessage, ServerResponse } from "http";
import { PlatformClient } from "./platform";
/**
 * Platform-agnostic handler that handles all pages (SSR, SSG, and API) and public files.
 * It requires passing a platform client which will implement methods for retrieving/storing pages, and triggering static regeneration.
 * @param req
 * @param res
 * @param responsePromise
 * @param manifest
 * @param prerenderManifest
 * @param routesManifest
 * @param options
 * @param platformClient
 */
export declare const defaultHandler: ({ req, res, responsePromise, manifest, prerenderManifest, routesManifest, options, platformClient }: {
    req: IncomingMessage;
    res: ServerResponse;
    responsePromise: Promise<any>;
    manifest: PageManifest;
    prerenderManifest: PrerenderManifestType;
    routesManifest: RoutesManifest;
    options: {
        logExecutionTimes: boolean;
    };
    platformClient: PlatformClient;
}) => Promise<void>;
