---
title: Stacksets with Landing Zone Accelerator
date: 2023-10-17 10:13:21
tags:
- AWS
- LZA
- Landing Zone Accelerator
- CloudFormation
- Stacksets
---

## LZA Overview

If you've not seen it yet, Landing Zone Accelerator ([LZA]) is a framework by AWS to help you build a multi-account AWS environment. It's a great way to get started with AWS, and it's a great way to get started with AWS Organizations and AWS Control Tower. It also provides a low code, YAML based configuration to roll out standard governance and security best practices.

[LZA] works by deploying a CodeCommit repo called `aws-accelerator-config` and a couple CodePipelines used to deploy the changes. All customizations are made within the `aws-accelerator-config` repo within select YAML and other related files, mostly JSON.

```bash
$ tree aws-accelerator-config/
.
├── accounts-config.yaml
├── global-config.yaml
├── iam-config.yaml
├── network-config.yaml
├── organization-config.yaml
├── security-config.yaml
└── tagging-policies
    ├── all-tag-policy.json
    └── map-tag-policy.json

2 directories, 8 files
```

Barebone default configs are created for you. You can then customize the configs to your liking. Once you're ready, you can deploy the changes to your AWS environments via the created pipeline called: `AWSAccelerator-Pipeline`. Be warned, the pipeline can take a _long_ time to run.

General documentation for [LZA] can be found here: https://awslabs.github.io/landing-zone-accelerator-on-aws/

The documentation is fairly good, but it helps to be familiar with CDK to understand how to read it. Expect some pain at first when trying to customize it. My hope is the information about additional customization below can help others deal with this.

## Pricing

[LZA] is not for basic AWS account usage, it is for enterprises to use who really need to start a new AWS account org structure off on the right foot. This means that the cost for an individual to use the service is high, but for an enterprise it is not much. AWS estimates the base cost to be around [$430 a month for standard usage](https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/cost.html). The pricing is based off the AWS services used by LZA, there is no LZA service cost by itsself. Be aware of this before you roll it out.

## Customizations

One feature that I haven't seen used much and is not documented well is the ability to use Stacksets and CloudFormation with [LZA]. This is a great way to deploy resources to all accounts in your AWS org. The documentation for this is [here](https://awslabs.github.io/landing-zone-accelerator-on-aws/#customization-configuration). The use cases for this are instances where for compliance or governance reasons you need to deploy resources to every account in ways not currently supported by LZA.

Some examples I've used this for is to deploy patching scheduled tasks to all accounts via SSM, more specific AWS Backup policies with with locks of backups for a time period, and finally for SNS topics and alerts we need per account.

Here is an example config:
```yaml
customizations:
    cloudFormationStackSets:
      - capabilities: [CAPABILITY_IAM, CAPABILITY_NAMED_IAM, CAPABILITY_AUTO_EXPAND]
        deploymentTargets:
          organizationalUnits:
            - Development
        description: Automated SSM patching for EC2 instances
        name: SSMPatching
        regions:
        - us-west-2
        template: cloudformation-stacksets/ssm-patching.yaml
      - capabilities: [CAPABILITY_IAM, CAPABILITY_NAMED_IAM, CAPABILITY_AUTO_EXPAND]
        deploymentTargets:
          organizationalUnits:
            - Development
            - Production
        description: Automated SSM patching for EC2 instances
        name: sns-notification-alerts
        regions:
        - us-west-2
        template: cloudformation-stacksets/config-sns-alerts.yaml
```

This is great because it gives us the ability to configure StackSets in the same location as our LZA where we manage other governance and security configurations. It also allows us to use the same pipeline to deploy the StackSets as we use to deploy the LZA configs. This is a huge win.

[LZA]: https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/solution-overview.html
