import { OriginConfig, Origin, Options } from "./getOriginConfig";
declare const _default: (origins: Origin[], options: Options) => {
    Origins: {
        Quantity: number;
        Items: OriginConfig[];
    };
    CacheBehaviors: {
        Quantity: number;
        Items: any;
    };
};
export default _default;
