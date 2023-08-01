import { Component } from "@serverless/core";
declare class AwsS3 extends Component {
    context: any;
    state: any;
    save: () => void;
    default(inputs?: any): Promise<any>;
    remove(): Promise<{
        name: any;
        region: any;
        accelerated: any;
    }>;
    upload(inputs?: any): Promise<void>;
}
export default AwsS3;
