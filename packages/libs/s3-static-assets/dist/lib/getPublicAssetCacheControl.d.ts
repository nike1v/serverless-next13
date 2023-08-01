export type PublicDirectoryCache = boolean | {
    test?: string;
    value?: string;
};
declare const getPublicAssetCacheControl: (filePath: string, options?: PublicDirectoryCache) => string | undefined;
export default getPublicAssetCacheControl;
