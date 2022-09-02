---
layout: blog
title: Lambda dependencies in CDK
date: 2020-09-24 09:31:05
tags:
  - aws
  - lambda
  - cdk
  - dependencies
---

When building serverless projects it is typically recommended to have both the application code and infrastructure described as a single code base. This way any changes can be made atomicly, especially with CloudFormation.

One solution for this is using [AWS SAM] and writing templates in CloudFormation. There are pre-build templates that can be used. Any of the supported SAM languages will pick up on typical dependency files such as `requirements.txt` for Python or `package.json` for NodeJS and bundle the dependencies in the lambda artifact.

For the CDK something similar can be done. It is possible to use the bundling component of the [Code](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-lambda.Code.html) class of [aws-lambda](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-readme.html). An example can be found [here](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-readme.html#bundling-asset-code)

```python
custom_function = aws_lambda.Function(
    self,
    "Function",
    code=aws_lambda.Code.from_asset("function/example",
        bundling={
            "image": aws_lambda.Runtime.PYTHON_3_8.bundling_docker_image,
            "command": ["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp -r . /asset-output"
            ]
        }
    ),
    runtime=aws_lambda.Runtime.PYTHON_3_8,
    handler="index.handler",
    timeout=core.Duration.minutes(15),
    log_retention=logs.RetentionDays.THREE_MONTHS,
)
```

The way this works is very similar to [AWS SAM]. In the background it fires up a docker container, usually a lambci image. Installs any dependencies in a given directory, then these dependencies can be copied into the `/asset-output` directory where the lambda code also lives.

The CDK approach to this is even more flexible because you can specify your own docker images, and commands to run. So you can use langauges not natively supported by [AWS SAM].

Also, for [Python](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-python-readme.html) and [NodeJS](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-nodejs-readme.html) there are pre-made constructs that do this natively.


```python
aws_lambda_python.PythonFunction(
    self,
    "PythonFunction",
    entry="function/example",
    index="index.py",
    handler="handler",
    runtime=aws_lambda.Runtime.PYTHON_3_8
)
```
