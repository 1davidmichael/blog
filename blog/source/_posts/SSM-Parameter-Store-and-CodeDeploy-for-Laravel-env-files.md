---
title: SSM Parameter Store and CodeDeploy for Laravel .env files
date: 2021-02-10 12:45:00
tags:
  - aws
  - laravel
  - parameter store
  - codedeploy
  - python
  - cdk
---

Laravel uses a `.env` file to define various configuration options. The best practice is to not commit this to your repository to keep any secrets in there private. This presented an issue when deploying applications via [AWS CodeDeploy] to EC2 instances.

For ECS/Fargate you would just set environment variables, but on EC2 that isn't an option. So the solution I came up with is to add parameters to [AWS Parameter Store] to save them in a persistent, updatable location. Then within the `appspec.yml` I add hooks to read from the parameter store based on patterns, and write them to the required location.

This has a few benefits:

* _SecureString_ type parameters are used to limit and securely store credentials as needed.
* The CDK can use parameters to set database credentials, so no need to lookup up variables to set it ahead of time or pass them into CDK/CFN as a CLI parameter.
* I can use the CDK to set other parameters that might be needed in the config, like SQS queue names for example.
* All env files are refreshed on deploy or new instances being created.
* No need to edit EC2 user-data or cfn-init to add these.
* Less AWS technical users can add entries to .env without being familiar with AWS infrastructure tools.

Example `appspec.yml` section:

```yaml
hooks:
  AfterInstall:
    - location: .codedeploy/scripts/secrets.py
      timeout: 120
    - location: .codedeploy/scripts/setup.sh
      timeout: 60
    - location: .codedeploy/scripts/migrate.sh
      timeout: 180
```

Here is an example script used to do this:

```python
#!/usr/bin/env python3
import boto3
import logging
import json
import os

client = boto3.client("ssm", region_name="us-east-1")
paginator = client.get_paginator('get_parameters_by_path')
environment = os.environ.get("DEPLOYMENT_GROUP_NAME", "home").split("-")[0]

for path in [ "shared", "home" ]:
  page_iterator = paginator.paginate(
      Path=f"/{ environment }/{ path }/",
      Recursive=True,
      WithDecryption=True,
  )
  for page in page_iterator:
      for parameter  in page["Parameters"]:
          key = parameter["Name"].split("/")[-1]
          value = parameter["Value"]
          env_file += f"{ key }=\"{ value }\"\n"

  with open("/var/www/.env", "w") as f:
      f.write(env_file)
```

Finally, here is an example of setting a parameter via the CDK for a resource that was created:

```python
self.database = aws_rds.DatabaseInstance(
    self,
    "DatabaseInstance",
    engine=aws_rds.DatabaseInstanceEngine.MARIADB,
    credentials=aws_rds.Credentials.from_password(
        username="admin",
        password=core.SecretValue.ssm_secure(
            parameter_name=f"/{ environment }/shared/DB_PASSWORD",
            version="1"
        )
    ),
    vpc=vpc,
    instance_type=aws_ec2.InstanceType.of(
        instance_class=aws_ec2.InstanceClass.BURSTABLE3,
        instance_size=aws_ec2.InstanceSize.MICRO
    ),
    allocated_storage=20,
    storage_encrypted=True,
    backup_retention=core.Duration.days(7),
)

aws_ssm.StringParameter(
    self,
    "DBHostParam",
    parameter_name=f"/{ environment }/shared/DB_HOST",
    string_value=self.database.db_instance_endpoint_address
)
```

One thing that is done here is I segregate secrets by path, so there are some shared between environments and apps, so by path I can select which ones are used. Now you just need to allow your EC2 instances permissions to read from the parameter store and you are all set to start adding configurations.

[AWS CodeDeploy]: https://docs.aws.amazon.com/codedeploy/latest/userguide/instances-ec2-configure.html
[AWS Parameter Store]: https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html
