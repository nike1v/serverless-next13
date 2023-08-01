declare const getAccountId: (aws: any) => Promise<any>;
declare const createLambda: ({ lambda, name, handler, memory, timeout, runtime, env, description, zipPath, bucket, role, layer, tags }: {
    lambda: any;
    name: any;
    handler: any;
    memory: any;
    timeout: any;
    runtime: any;
    env: any;
    description: any;
    zipPath: any;
    bucket: any;
    role: any;
    layer: any;
    tags: any;
}) => Promise<{
    arn: any;
    hash: any;
}>;
declare const updateLambdaConfig: ({ lambda, name, handler, memory, timeout, runtime, env, description, role, layer, tags }: {
    lambda: any;
    name: any;
    handler: any;
    memory: any;
    timeout: any;
    runtime: any;
    env: any;
    description: any;
    role: any;
    layer: any;
    tags: any;
}) => Promise<{
    arn: any;
    hash: any;
}>;
declare const updateLambdaCode: ({ lambda, name, zipPath, bucket }: {
    lambda: any;
    name: any;
    zipPath: any;
    bucket: any;
}) => Promise<any>;
declare const getLambda: ({ lambda, name }: {
    lambda: any;
    name: any;
}) => Promise<{
    name: any;
    description: any;
    timeout: any;
    runtime: any;
    role: {
        arn: any;
    };
    handler: any;
    memory: any;
    hash: any;
    env: any;
    arn: any;
}>;
declare const deleteLambda: ({ lambda, name }: {
    lambda: any;
    name: any;
}) => Promise<void>;
declare const getPolicy: ({ name, region, accountId }: {
    name: any;
    region: any;
    accountId: any;
}) => {
    Version: string;
    Statement: {
        Action: string[];
        Resource: string[];
        Effect: string;
    }[];
};
declare const configChanged: (prevLambda: any, lambda: any) => boolean;
declare const pack: (code: any, shims?: any[], packDeps?: boolean) => string | Promise<unknown>;
export { createLambda, updateLambdaCode, updateLambdaConfig, getLambda, deleteLambda, getPolicy, getAccountId, configChanged, pack };
