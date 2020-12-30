---
layout: blog
title: Overriding CDK Properties
date: 2020-12-30 10:34:04
tags:
  - cdk
  - CloudFormation
  - AWS
---

When using the CDK to create resources you may want to override some properties of an individual resource that can't be done with the Construct. A good example is the RDS Cluster construct's instances that are created. I am in the process of migrating certain clusters to use the new Graviton2 processors and want to do it a single instance at a time to avoid outages.

Luckily, the CDK makes it easy to access those underlying CFN resources and override them.

```python
        cluster = aws_rds.DatabaseCluster(
            self,
            "TestCluster",
            engine=aws_rds.DatabaseClusterEngine.aurora_postgres(
                version=aws_rds.AuroraPostgresEngineVersion.of(
                    aurora_postgres_major_version="11",
                    aurora_postgres_full_version="11.9"
                )
            ),
            parameter_group=aws_rds.ParameterGroup.from_parameter_group_name(
                self,
                "ParamGroup",
                parameter_group_name="default.aurora-postgresql11"
            ),
            instances=2,
            instance_props=aws_rds.InstanceProps(
                vpc=vpc,
                instance_type=aws_ec2.InstanceType.of(
                    instance_class=aws_ec2.InstanceClass.MEMORY5,
                    instance_size=aws_ec2.InstanceSize.LARGE
                )
            ),
            removal_policy=core.RemovalPolicy.DESTROY
        )

        for resource in cluster.node.find_all():
            print(resource.node.id)

        instance1 = cluster.node.find_child(id="Instance1")
        instance1.db_instance_class = "db.r6g.large"
```

In this case I am, for debugging purposes, outputting all the resource IDs. Then using the correct ID I convert it to a CFN resource and override the parameter I want. Now I will end up with one `db.r5.large` instance and one `db.r6g.large` instance.

Since the CDK doesn't support 11.9 for Aurora yet I've had to manually specify the major and full versions, but luckily that will be [resolved soon 😃](https://github.com/aws/aws-cdk/pull/12267).
