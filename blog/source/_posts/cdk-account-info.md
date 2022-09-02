---
layout: blog
title: CDK Account Info
date: 2020-07-14 12:40:58
tags:
  - cdk
  - aws
  - account
---

The CDK offers some interesting options for using existing AWS resouces within it. One example I am using is to use an existing Route 53 hosted zone to generate an ACM validation resource record. But in order to do this the CDK needs to know the HostZone info.

My approach to this is to use the [fromLookup](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-route53.HostedZone.html#static-from-wbr-lookupscope-id-query) method on HostedZone construct. But to do this the CDK needs the AWS region and account id.

This is resolved by looking at environment variables added to the GitHub Actions pipeline and then referenced within the CDK code.

Example:
{% codeblock lang:javascript %}
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
        'account': process.env.AWS_ACCOUNT_ID,
        'region': process.env.AWS_DEFAULT_REGION
    }
});

Tag.add(stack, "Environment", "Prod");
{% endcodeblock %}

I then also use the [dotenv](https://www.npmjs.com/package/dotenv) nodejs package to pull those environment variables from a file locally for development purposes.

This step then works as expected and pulls in the HostedZoneId to be used later

{% codeblock lang:javascript %}
    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: 'dmichael.be',
      privateZone: false
    });

    const certificate = new certmanager.DnsValidatedCertificate(this, "Certificate", {
      domainName: `${subdomain.valueAsString}.dmichael.be`,
      hostedZone
    });
{% endcodeblock %}

Longer term it might be possible to look these up dynamically via the [AWS SDK for JavaScript](https://aws.amazon.com/sdk-for-node-js/) and not need to include them at all. But for not this works. There are also CDK environment variables that could be used directly, `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION`.
