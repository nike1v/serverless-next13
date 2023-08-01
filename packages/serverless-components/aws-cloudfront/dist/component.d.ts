import { Component } from "@serverless/core";
declare class CloudFront extends Component {
    context: any;
    state: any;
    save: () => void;
    default(inputs?: any): Promise<any>;
    remove(): Promise<{}>;
}
export default CloudFront;
