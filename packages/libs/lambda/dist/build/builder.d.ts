import { ImageBuildManifest, PageManifest } from "@sls-next/core";
import CoreBuilder from "@sls-next/core/dist/build/builder";
import { Manifest, CoreBuildOptions } from "@sls-next/core";
import { LambdaBuildOptions, LambdaManifest } from "src/types";
export declare const DEFAULT_LAMBDA_CODE_DIR = "default-lambda";
export declare const IMAGE_LAMBDA_CODE_DIR = "image-lambda";
export declare class LambdaBuilder extends CoreBuilder {
    protected lambdaBuildOptions: LambdaBuildOptions;
    constructor(lambdaBuildOptions: LambdaBuildOptions, coreBuildOptions?: CoreBuildOptions);
    protected buildPlatform(manifests: {
        imageManifest: Manifest;
        pageManifest: PageManifest;
    }, debugMode?: boolean): Promise<void>;
    /**
     * Process and copy handler code. This allows minifying it before copying to Lambda package.
     * @param handlerType
     * @param destination
     * @param shouldMinify
     */
    protected processAndCopyHandler(handlerType: "default-handler" | "image-handler", destination: string, shouldMinify: boolean): Promise<void>;
    /**
     * Build default lambda which handles all requests as well as regeneration requests.
     * @param pageManifest
     * @param lambdaManifest
     * @private
     */
    protected buildDefaultLambda(pageManifest: Manifest, lambdaManifest: LambdaManifest): Promise<void[]>;
    /**
     * Build image optimization lambda (supported by Next.js 10+)
     * @param imageBuildManifest
     * @param lambdaManifest
     */
    protected buildImageLambda(imageBuildManifest: ImageBuildManifest, lambdaManifest: LambdaManifest): Promise<void>;
}
