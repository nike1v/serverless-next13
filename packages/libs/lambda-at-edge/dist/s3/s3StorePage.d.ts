interface S3StorePageOptions {
    basePath: string | undefined;
    uri: string;
    revalidate?: number | undefined;
    bucketName: string;
    html: string;
    buildId: string;
    region: string;
    pageData: Record<string, any>;
}
export declare const s3StorePage: (options: S3StorePageOptions) => Promise<{
    cacheControl: string | undefined;
    expires: Date | undefined;
}>;
export {};
