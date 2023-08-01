import AWS from "aws-sdk";
declare const getClients: (credentials: any, region: any) => {
    regular: AWS.S3;
    accelerated: AWS.S3;
};
declare const bucketCreation: (s3: AWS.S3, Bucket: string) => any;
declare const ensureBucket: (s3: any, name: any, debug: any) => Promise<void>;
declare const uploadDir: (s3: any, bucketName: any, dirPath: any, cacheControl: any, options: any) => Promise<void>;
declare const packAndUploadDir: ({ s3, bucketName, dirPath, key, append, cacheControl }: {
    s3: any;
    bucketName: any;
    dirPath: any;
    key: any;
    append?: any[];
    cacheControl: any;
}) => Promise<void>;
declare const uploadFile: ({ s3, bucketName, filePath, key, cacheControl }: {
    s3: any;
    bucketName: any;
    filePath: any;
    key: any;
    cacheControl: any;
}) => Promise<void>;
declare const clearBucket: (s3: any, bucketName: any) => Promise<void>;
declare const accelerateBucket: (s3: any, bucketName: any, accelerated: any) => any;
declare const deleteBucket: (s3: any, bucketName: any) => Promise<void>;
declare const configureCors: (s3: any, bucketName: any, config: any) => any;
declare const configureBucketTags: (s3: any, bucketName: any, configTags: any) => Promise<void>;
export { getClients, uploadDir, packAndUploadDir, uploadFile, clearBucket, accelerateBucket, deleteBucket, bucketCreation, ensureBucket, configureCors, configureBucketTags };
