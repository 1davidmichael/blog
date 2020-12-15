#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { InfraStack } from '../lib/infra-stack';
import { Tag } from '@aws-cdk/core';

import { config } from "dotenv";

config();

const app = new cdk.App();
const stack = new InfraStack(app, 'InfraStack', {
    stackName: 'DMBlog',
    env: {
        // https://docs.aws.amazon.com/cdk/latest/guide/environments.html
        account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION
    }
});

Tag.add(stack, "Environment", "Prod");