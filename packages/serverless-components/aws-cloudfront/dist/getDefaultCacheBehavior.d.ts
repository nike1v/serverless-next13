type DefaultCacheBehavior = {
    allowedHttpMethods?: string[];
    forward?: Record<string, string>;
    minTTL?: number;
    defaultTTL?: number;
    maxTTL?: number;
    compress?: boolean;
    smoothStreaming?: boolean;
    viewerProtocolPolicy?: string;
    fieldLevelEncryptionId?: string;
    responseHeadersPolicyId?: string;
    realtimeLogConfigArn?: string;
};
declare const _default: (originId: any, defaults?: DefaultCacheBehavior) => {
    TargetOriginId: any;
    ForwardedValues: Record<string, unknown>;
    TrustedSigners: {
        Enabled: boolean;
        Quantity: number;
        Items: any[];
    };
    ViewerProtocolPolicy: string;
    MinTTL: number;
    AllowedMethods: {
        Quantity: number;
        Items: string[];
        CachedMethods: {
            Quantity: number;
            Items: string[];
        };
    };
    SmoothStreaming: boolean;
    DefaultTTL: number;
    MaxTTL: number;
    Compress: boolean;
    LambdaFunctionAssociations: {
        Quantity: number;
        Items: any[];
    };
    FieldLevelEncryptionId: string;
    ResponseHeadersPolicyId: string;
    RealtimeLogConfigArn: string;
};
export default _default;
