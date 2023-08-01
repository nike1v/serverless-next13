export type CacheBehavior = {
    LambdaFunctionAssociations: {
        Quantity: number;
        Items: {
            EventType: string;
            LambdaFunctionARN: string;
            IncludeBody: boolean | undefined;
        }[];
    };
};
declare const _default: (cacheBehavior: CacheBehavior, lambdaAtEdgeConfig?: {}) => void;
export default _default;
