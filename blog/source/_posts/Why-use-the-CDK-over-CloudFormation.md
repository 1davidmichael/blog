---
title: Why do I use the CDK over CloudFormation?
date: 2021-02-12 21:31:03
tags:
  - cdk
  - aws
---

It has now been over 6 months since I have started using the CDk and it has come a long way. I thought it worth taking a moment to reflect on why I started using and why I continue to.

## The Beginning

Initially starting out using the CDK I liked the principle of it because it allowed data structures and functions not available in CloudFormation. So now if I needed multiple similar S3 buckets I could just loop over a list. I no longer had to list them out individually. Im the examples below it may not look like much, but imagine managing tens or even hundreds of the same resources and it becomes painful.

So this:

```yaml
Resources:
  Bucket1:
    Type: AWS::S3::Bucket
  Bucket2:
    Type: AWS::S3::Bucket
  Bucket3:
    Type: AWS::S3::Bucket
```

Can become this:

```python
from aws_cdk import core, aws_s3

buckets = ["bucket1", "bucket2", "bucket3"]
for bucket in buckets:
  aws_s3.Bucket(self, bucket)
```

Another benefit was the ability to write custom constructs, if there are reusable patterns I no longer are required to use messy nested stack templates. Instead I can use native programming language tools to write libraries. Even better, AWS publishes these for us, so things like [ecs-patterns](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-ecs-patterns-readme.html) or serverless constructs like those in [AWS Solutions Constructs](https://docs.aws.amazon.com/solutions/latest/constructs/welcome.html) can save a lot of time and headaches. Before hand, these templates could have been 1000+ lines and were difficult to read, a single error could result in stack issues.

These reasons for wanting to use the CDK are good in their own rights but I have discovered ancillary benefits I'd like to go over.

## The Now

Now that I have been using the CDK for sometime I have come to realize multiple other benefits that at first are not as obvious but now would be difficult to live without. Basically the only time I ever use CloudFormation is for one of two reasons:

1. Serverless application development - This is still possible with the CDK and in some cases preferred, but debugging lambdas via CDK is a pain. So if its a simple lambda, with little to no resource interaction, stick with [SAM](https://aws.amazon.com/serverless/sam/).
1. The resources are not will supported by CDK yet - This still happens, CDK is under development and many resources have L2 constructs created. Even L1 CFN constructs are useful but can be a bit clunky. So if there is NO CDK support or very limited I will still use CloudFormation.

I will use the CDK now for the reasons above and new ones.

**Resource typing prevents mistakes and simplifies development**

It is now more obvious when working in my editor what inputs are expected for a given resources properties. Using [VS Code](https://code.visualstudio.com/) or [vim with COC](https://github.com/neoclide/coc.nvim) you can get really awesome auto-complete. I tried to demonstrate this with a inline gif but failed miserably at getting it small. So just trust me, it is great.

**[grants](https://docs.aws.amazon.com/cdk/latest/guide/permissions.html#permissions_grants) and [connections](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-ec2.Connections.html) make IAM permissions and security groups a breeze**

Rather than having to define a lambda security policy that can access a bucket or queue, I can just use that resource to grant access. Of course, you can still define the role, policy and statement if you prefer or need to work around the edges.

```python
bucket = aws_s3.Bucket(self, "ExampleBucket")
example_lambda = aws_lambda_python.PythonFunction(self, "ExampleLambda",
    entry="functions/example",
    index="app.py",
    handler="handler",
    runtime=lambda_.Runtime.PYTHON_3_6
)

bucket.grant_read(example_lambda)
```

**Better Stack Management**

When dealing with CloudFormation I generally kept to one stack, or a single stack, with nested stacks under it. The reason why is CloudFormation exports are a pain. The good news is the CDK makes it trivial to share resource outputs between stacks.

Below is an example of a python CDK project with a VPC stack, shared with both a shared resources and load balancer stack. Those outputs are automatically passed between the vpc, shared and load balancer CFN stacks and managed by the CDK at synth/deployment.

```python
vpc_stack = VpcStack(app, "vpc-stack", env=env)

shared_stack = Shared(app,
  f"{ environment }-shared",
  vpc=vpc_stack.vpc,
  environment=environment
)

load_balancer_stack = LoadBalancerStack(
  app,
  f"{ environment }-loadbalancer",
  vpc=vpc_stack.vpc,
  environment=environment
)
```

I will warn you, the same limitations around altering shared stacks exports still exists in the CDK as it does with CloudFormation, so use it judiciously. But at least it is possible and a whole lot easier.

## The Future

All in all, I really enjoy the CDK and encourage anyone currently using CloudFormation heavily to take a look at it. I expect its omnipresence to only grow both outside of AWS and inside of it. Already AWS is converting resources internal to use it according to their [podcast](https://aws.amazon.com/podcasts/423-aws-solutions-constructs).

My hopes for the future are that AWS continues to expand the testing capabilities of Typescript CDK to other languages and expands the L2 and Solutions Constructs.