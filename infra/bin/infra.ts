#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { InfraStack } from '../lib/infra-stack';
import { countReset } from 'console';
import { Tag } from '@aws-cdk/core';

const app = new cdk.App();
const stack = new InfraStack(app, 'InfraStack', {
    stackName: 'DMBlog',
    env: {
        'account': process.env.AWS_ACCOUNT_ID,
        'region': process.env.AWS_DEFAULT_REGION
    }
});

Tag.add(stack, "Environment", "Prod");