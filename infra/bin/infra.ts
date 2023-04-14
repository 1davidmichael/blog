#!/usr/bin/env node
import 'source-map-support/register';
import { InfraStack } from '../lib/infra-stack';
import { App, Tags } from 'aws-cdk-lib';


const app = new App();
const stack = new InfraStack(app, 'InfraStack', {
    stackName: 'DMBlog',
    env: {
        // https://docs.aws.amazon.com/cdk/latest/guide/environments.html
        account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION
    }
});

Tags.of(stack).add("Environment", "Prod");
