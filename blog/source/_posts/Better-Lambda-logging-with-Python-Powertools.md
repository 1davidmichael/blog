---
title: Better Lambda logging with Python Powertools
date: 2021-03-17 15:29:55
tags:
  - python
  - lambda
  - aws
  - powertools
---

When writing Lambdas in Python there are some things I usually have to do in order to get them working. It usually goes something like this:

1. Create python lambda
1. Dump the event so I can inspect it and see what I need
1. Make changes
1. Log additional things
1. Rinse and Repeat

So the initial Lambda looks something like this:

```python
def handler(event, context):
    print(event)
```

But lately, I've discovered some solutions to make this better.

## Generate test events

First off, rather than creating a Lambda, dumping the event to view it and continuing from there, use [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-generate-event.html) to create example events:

```bash
sam local generate-event \
    s3 put \
    --bucket example-bucket \
    --key example-key
```

That outputs this:

```json
{
  "Records": [
    {
      "eventVersion": "2.0",
      "eventSource": "aws:s3",
      "awsRegion": "us-east-1",
      "eventTime": "1970-01-01T00:00:00.000Z",
      "eventName": "ObjectCreated:Put",
      "userIdentity": {
        "principalId": "EXAMPLE"
      },
      "requestParameters": {
        "sourceIPAddress": "127.0.0.1"
      },
      "responseElements": {
        "x-amz-request-id": "EXAMPLE123456789",
        "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
      },
      "s3": {
        "s3SchemaVersion": "1.0",
        "configurationId": "testConfigRule",
        "bucket": {
          "name": "example-bucket",
          "ownerIdentity": {
            "principalId": "EXAMPLE"
          },
          "arn": "arn:aws:s3:::example-bucket"
        },
        "object": {
          "key": "test/key",
          "size": 1024,
          "eTag": "0123456789abcdef0123456789abcdef",
          "sequencer": "0A1B2C3D4E5F678901"
        }
      }
    }
  ]
}
```

This results in example events you can save for testing and customize as needed. Many events (but not all) are supported. Now you can use something like `sam local invoke` and point to that event for testing. Coupled with either [moto](https://github.com/spulec/moto) or [localstack](https://github.com/localstack/localstack) you can use it for testing purposes locally.


## Better Lambda Logging

For a long time I've just used `print()` statements in Lambdas to get what I wanted out of them. This was a big mistake. First off, AWS extends the logging format used by the default Python logging library, so just by using that you get additional context of log level, and invocation in the log output. But there is even a better solution, [Lambda Powertools Python](https://awslabs.github.io/aws-lambda-powertools-python/core/logger/).

By using this logging functionality you can get better structured logs in CloudWatch Logs and even automatically include the event. The example Lambda to invalidate a CloudFront cache below uses it to output the event to the logs, and also logs some additional info in a structured format.

```python
from aws_xray_sdk.core.patcher import patch
import boto3
import botostubs
import json
import os
import time
from aws_lambda_powertools import Logger

from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()
logger = Logger()

@logger.inject_lambda_context(log_event=True)
def lambda_handler(event, context):
    distribution_id = os.environ["DISTRIBUTION_ID"]
    client = boto3.client('cloudfront')  # type: botostubs.CloudFront

    body = json.loads(event['body'])

    try:
        invalidation = client.create_invalidation(
            DistributionId=distribution_id,
            InvalidationBatch={
                'Paths': {
                    'Quantity': 1,
                    'Items': [
                        body["path"]
                    ]
                },
                'CallerReference': str(time.time())
            }

        )
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "message": "Invalidation Failed",
                "error": e
            }),
        }

    logger.info({
        "distribution_id": distribution_id,
        "path": body["path"],
        "invalidation_id": invalidation["Invalidation"]["Id"]
    })

    return {
        "statusCode": 200,
        "body": json.dumps({
            "invalidation_id": invalidation["Invalidation"]["Id"],
        }),
    }

```

Resulting in logs that look like this:

{% asset_img example.png Example Logs %}

```json
{
    "level": "INFO",
    "location": "lambda_handler:45",
    "message": {
        "distribution_id": "E1GK1CZ2RI1SA9",
        "path": "/some/random/path",
        "invalidation_id": "I2Y9BI9352RDNG"
    },
    "timestamp": "2021-03-17 20:09:19,582",
    "service": "service_undefined",
    "sampling_rate": 0,
    "cold_start": false,
    "function_name": "example-cf-invalidation-HelloWorldFunction-12DDCZH4QJ11T",
    "function_memory_size": "1024",
    "function_arn": "arn:aws:lambda:us-east-1:765419780228:function:example-cf-invalidation-HelloWorldFunction-12DDCZH4QJ11T",
    "function_request_id": "fa113d6d-a7ca-4e94-9ef0-5e5648fee3e2",
    "xray_trace_id": "1-605261ee-29710f5810f98fc61aa81446"
}
```

Now the resulting logs are much easier to review visually, easier to parse if needed and easier to query with CloudWatch Log Insights. All with just an additional dependency and adding a few lines of code to the Lambda.