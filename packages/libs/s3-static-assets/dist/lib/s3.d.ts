import AWS from "aws-sdk";
type S3ClientFactoryOptions = {
    bucketName: string;
    bucketRegion: string;
    credentials: Credentials;
};
type UploadFileOptions = {
    filePath: string;
    cacheControl?: string;
    s3Key?: string;
};
type DeleteFilesByPatternOptions = {
    prefix: string;
    pattern: RegExp;
    excludePattern?: RegExp;
};
type GetFileOptions = {
    key: string;
};
export type S3Client = {
    uploadFile: (options: UploadFileOptions) => Promise<AWS.S3.ManagedUpload.SendData>;
    deleteFilesByPattern: (options: DeleteFilesByPatternOptions) => Promise<void>;
    getFile: (options: GetFileOptions) => Promise<string | undefined>;
};
export type Credentials = {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
};
declare const _default: ({ bucketName, bucketRegion, credentials }: S3ClientFactoryOptions) => Promise<S3Client>;
export default _default;
