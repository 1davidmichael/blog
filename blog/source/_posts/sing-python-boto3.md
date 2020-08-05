---
layout: blog
title: Using Python Boto3
date: 2020-08-05 15:18:26
tags:
  - python
  - boto3
  - aws
---

# Boto3

Here are some general things I've noticed now that I am doing a bit more development with Python and Boto3 to automate things in AWS.

## Use Waiters

Frequently within AWS you will request a resource and it will take time to provision. Boto3's way of handling this is with waiters. For example CloudFormation has multiple [waiters available](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/cloudformation.html#waiters) to use.

These make it easier to provision an AWS resource, and then wait for it to be done. Rather than implementing some arbitrary wait period or wasteful loop burning through API calls.

```python
# Don't ask me why you'd do this. Just an example that creates a stack
# waits for it to be done creating, then deletes it.

import boto3

client = boto3.client("cloudformation")

stack_name = "testStack"

client.create_stack(
    StackName=stack_name,
    TemplateURL="s3://some-bucket/template.yaml"
)

waiter = client.get_waiter("stack_create_complete")

waiter.wait(
    StackName=stack_name
)

client.delete_stack(
   StackName=stack_name
)
```

I haven't gotten too deep into it yet but there are cases where a resource doesn't have a waiter. If that is the case you can create your own as described [here](https://www.2ndwatch.com/blog/use-waiters-boto3-write/). I suspect I'll have to create one of these soon for CFN StackSets.

## Paginators

Like waiters, another common task is having to paginate through the response from AWS. Fortunately, Boto3 has built in paginators to assist with this.

```python
# S3 list object example with pagination

client = boto3.client('s3')

paginator = client.get_paginator('list_objects')
pages = paginator.paginate(Bucket='example-bucket')
for page in pages:
    for obj in page['Contents']:
        print(obj["Key"])
```

## Exceptions/Returns

It took me a lot longer than I should have realized but all possible Boto3 exceptions for a given call are listed below the request syntax and parameter info in the Boto3 documentation.

## CFN Custom Resources

Finally a note about [CloudFormation Lambda Custom Resources](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-custom-resources-lambda.html). I have generally avoided them because they are so painful to write for. You can get stuck in rollback hell by missing an exception and having to wait for it to rollback, timeout, then ultimately fail. However, there is now a Python library called [crhelper](https://pypi.org/project/crhelper/) that takes away many of the pain points and makes it easy to implement.

No more worrying about uncaught exceptions, painful rollbacks and mangled complete/fail calls.