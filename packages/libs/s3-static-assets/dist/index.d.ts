import AWS from "aws-sdk";
import path from "path";
import { Credentials } from "./lib/s3";
import { PublicDirectoryCache } from "./lib/getPublicAssetCacheControl";
type UploadStaticAssetsOptions = {
    bucketName: string;
    bucketRegion: string;
    basePath: string;
    nextConfigDir: string;
    nextStaticDir?: string;
    credentials: Credentials;
    publicDirectoryCache?: PublicDirectoryCache;
};
type AssetDirectoryFileCachePoliciesOptions = {
    basePath: string;
    serverlessBuildOutDir: string;
    nextStaticDir?: string;
    publicDirectoryCache?: PublicDirectoryCache;
};
declare const getAssetDirectoryFileCachePolicies: (options: AssetDirectoryFileCachePoliciesOptions) => Array<{
    cacheControl: string | undefined;
    path: {
        relative: string;
        absolute: string;
    };
}>;
declare const uploadStaticAssetsFromBuild: (options: UploadStaticAssetsOptions) => Promise<AWS.S3.ManagedUpload.SendData[]>;
type DeleteOldStaticAssetsOptions = {
    bucketName: string;
    bucketRegion: string;
    basePath: string;
    credentials: Credentials;
};
declare const deleteOldStaticAssets: (options: DeleteOldStaticAssetsOptions) => Promise<void>;
export { getAssetDirectoryFileCachePolicies, deleteOldStaticAssets, uploadStaticAssetsFromBuild };
