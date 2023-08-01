interface TriggerStaticRegenerationOptions {
    request: AWSLambda.CloudFrontRequest;
    eTag: string | undefined;
    lastModified: string | undefined;
    basePath: string | undefined;
    pagePath: string;
    pageS3Path: string;
    queueName: string;
}
export declare const triggerStaticRegeneration: (options: TriggerStaticRegenerationOptions) => Promise<{
    throttle: boolean;
}>;
export {};
