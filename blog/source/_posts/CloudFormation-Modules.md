---
layout: blog
title: CloudFormation Modules
date: 2020-11-25 10:17:00
tags:
  - aws
  - cloudformation
  - modules
---

Recently AWS announced [CloudFormation Modules](https://aws.amazon.com/blogs/mt/introducing-aws-cloudformation-modules/) so I am taking some time to explore them, what the use cases are, what restrictions there may be, and learn how they work.

**Use Cases**

Here is what [AWS says](https://docs.aws.amazon.com/cloudformation-cli/latest/userguide/modules.html) are the use cases:

> Modules are a way for you to package resource configurations for inclusion across stack templates, in a transparent, manageable, and repeatable way. Use modules to encapsulate common service configurations and best practices as modular, customizable building blocks that users can then take and include in their stack templates. Modules enable you to capture and disseminate resource configurations that incorporate best practices, expert domain knowledge, and accepted guidelines (for areas such as security, compliance, governance, and industry regulations). Users can then include the module in their template without having to acquire deep knowledge of the intricacies of the resource implementation.

Sounds pretty good to me. I've used [nested stacks](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-nested-stacks.html) for this very purpose but they have some restrictions. The nested stack changes won't show up in any change sets without significant work. The templates must be in S3. And there is no native versioning, so it is up to you to develop that tooling yourself. CloudFormation Modules seem to address all those concerns. I like the idea of providing company best practices to CloudFormation users. There are similar tools that could help enforce these like [cfn-guard](https://aws.amazon.com/about-aws/whats-new/2020/06/introducing-aws-cloudformation-guard-preview/) in CI/CD pipelines, but this provides a pre-canned solution for developers.

**Limitations**

There are limitations described here: <https://docs.aws.amazon.com/cloudformation-cli/latest/userguide/modules-structure.html>

A few key ones to call out.

* No Transforms, including the ones for SAM. Understandable but a bit of a pain for anyone doing serverless deployments and want to provide an easier experience for developers.

* No importing stack values. This makes it more of a pain if you have certain other values you need to import. But if that is the case they could be imported in the template as a parameter to the module. Rather than used in the module directly.

* Module template format is only allowed to be json. Tools like `cfn-flip` could be used to swap between the formats but this is a disappointment given how much more readable the YAML format is.


There are some limitations of the modules that may cause some struggles if you are not aware of them.

One nice thing that I didn't anticipate is you can nest modules by calling one module in another. Allowing the building blocks of modules to be stacked.

**Authoring Modules**

Module development is pretty straight forward. Using the `cfn` tool you create a new module, add your template to the `fragments` directory and go from there. One thing to note is there can only be one template file in the `fragments` directory.

Modules are given a resource type name at creation using this format `<Organization>::<Service>::<Name>::MODULE`

**Deploying and Using Modules**

When your module is complete you can use the `cfn` tool again to deploy it with the `submit` sub-command. One thing to be aware of is the first module you deploy to an account will create its own CFN stack with some prerequisite resources. The stack it creates is `CloudFormationManagedUploadInfrastructure` and includes some buckets, a bucket policy, kms key and role.

Once this stack is created the module will be uploaded to the CloudFormation registry under the Modules section. One thing that is strange to me is the first version you upload is the default version. Subsequent versions deployed will not be the default unless you include the `--set-default` flag.

I've created a basic example here: <https://github.com/1davidmichael/Example-CFN-Module>

The module creates an S3 bucket with a lifecycle rule.

```json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "A logging S3 Bucket that removes objects after 30 days",
    "Resources": {
        "S3Bucket": {
            "Type": "AWS::S3::Bucket",
            "DeletionPolicy": "Delete",
            "Properties": {
                "LifecycleConfiguration": {
                    "Rules": [
                        {
                            "Id": "CleanupOldEntries",
                            "Status": "Enabled",
                            "ExpirationInDays": 30
                        }
                    ]
                }
            }
        }
    }
}
```

This module can then be used in templates. When deploying your template with modules you will need to specify the `CAPABILITY_AUTO_EXPAND` permission.

```yaml
Resources:
  Bucket:
    Type: DavidMichael::S3::LogBucket::MODULE
```

The resources are created in this same stack, using the logical IDs in the module prefixed with the logical ID of the resource in the stack. In the example provided above the logical ID created is `BucketS3Bucket`. Once deployed you can view the processed template, here is an example of what that looks like:

```yaml
Parameters: {
  }
Mappings: {
  }
Conditions: {
  }
Rules: {
  }
Resources:
  BucketS3Bucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Metadata:
      AWS::Cloudformation::Module:
        TypeHierarchy: DavidMichael::S3::LogBucket::MODULE
        LogicalIdHierarchy: Bucket
    Properties:
      LifecycleConfiguration:
        Rules:
        - Status: Enabled
          ExpirationInDays: 30
          Id: CleanupOldEntries
Outputs: {
  }
AWSTemplateFormatVersion: '2010-09-09'
Hooks: {
  }
```

By the way, that logical ID that is generated has to be unique. So you can't name another resource in the same stack `BucketS3Bucket`, if you do you get a logical ID conflict and the stack rolls back.

All in all, I really like modules and hope to start using them more. Eventually I hope they co-exist with the CDK constructs and perhaps the CDK can even be used to generate modules for re-use in other stacks with better testing.