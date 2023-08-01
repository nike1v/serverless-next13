import { IncomingMessage, ServerResponse } from "http";
import { PageManifest, RegenerationEvent } from "./types";
import { PlatformClient } from "./platform";
export declare const regenerationHandler: ({ req, res, regenerationEvent, manifest, platformClient }: {
    req: IncomingMessage;
    res: ServerResponse;
    regenerationEvent: RegenerationEvent;
    manifest: PageManifest;
    platformClient: PlatformClient;
}) => Promise<void>;
