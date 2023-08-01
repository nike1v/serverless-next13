import { ObjectResponse, PlatformClient, StorePageOptions, TriggerStaticRegenerationOptions } from "@sls-next/core";
/**
 * Client to access pages/files, store pages to S3 and trigger SQS regeneration.
 */
export declare class AwsPlatformClient implements PlatformClient {
    private readonly bucketRegion;
    private readonly bucketName;
    private readonly regenerationQueueRegion;
    private readonly regenerationQueueName;
    constructor(bucketName: string, bucketRegion: string, regenerationQueueName: string | undefined, regenerationQueueRegion: string | undefined);
    getObject(pageKey: string): Promise<ObjectResponse>;
    storePage(options: StorePageOptions): Promise<{
        cacheControl: string | undefined;
        expires: Date | undefined;
    }>;
    triggerStaticRegeneration(options: TriggerStaticRegenerationOptions): Promise<{
        throttle: boolean;
    }>;
}
