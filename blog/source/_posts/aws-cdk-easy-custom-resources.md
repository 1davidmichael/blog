---
layout: blog
title: AWS CDK Easy Custom Resources
date: 2020-07-14 22:44:59
tags:
  - cloudformation
  - cdk
  - custom-resources
---

CloudFormation is a great tool by AWS for describing infrastructure in a repeatable way. But it has one serious drawback compared to other services such as [Terraform](https://www.terraform.io/). When new features are release by AWS, frequently there is a waiting game while the CloudFormation team catches up. Typically terraform already has resources for services within days of it going GA if there was a beta.

But with the AWS CDK they provide an easy way to get started with custom resources, the CFN solution to non-supported resources. Previously with CFN you had to write your own lambda, deploy it, and reference it in a CFN stack. Now with the CDK you can create a custom resource via the [AwsCustomResource](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_custom-resources.AwsCustomResource.html) construct and directly call AWS APIs. So if the resource can be created in a single API call, it can be created in this method.

I've worked out a basic method for doing this for [AWS CodeArtifact](https://docs.aws.amazon.com/codeartifact/latest/ug/welcome.html), a resource not yet supported by CloudFormation.

Here is the example code snippet:

{% codeblock lang:javascript %}
import * as cdk from '@aws-cdk/core';
import * as customResource from '@aws-cdk/custom-resources';
import { AwsCustomResourcePolicy } from '@aws-cdk/custom-resources';

export class ExampleCustomResourceCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create AWS CodeArtifact domain
    const artifact_domain = new customResource.AwsCustomResource(this, "Domain", {
      onCreate: {
        service: "CodeArtifact",
        action: "createDomain",
        parameters: {
          domain: 'testdomain'
        },
        physicalResourceId: customResource.PhysicalResourceId.of('testDomain')
      },
      policy: customResource.AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE
      })
    });

    // Create AWS CodeArtifact repository
    const artifact_repo = new customResource.AwsCustomResource(this, "Repository", {
      onCreate: {
        service: "CodeArtifact",
        action: "createRepository",
        parameters: {
          domain: 'testdomain',
          repository: 'testrepository'
        },
        physicalResourceId: customResource.PhysicalResourceId.of('testRepository')
      },
      policy: customResource.AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE
      })
    });
  }
}
{% endcodeblock %}

Both the resources here are basic examples with hard coded names, the resources are also not able to be updated or deleted successfully. But this shows how easy it is to implement with the CDK and with a bit of work these could be further modified to support delete cases and additional parameters.

As mentioned in [this veryjoe.com blog post](https://veryjoe.com/tech/2019/07/28/Simple-Custom-Resources-AWS-CDK.html) you will need to reference the AWS JS SDK to make sure you are using the correct service, actions and parameters.
