---
layout: blog
title: Don't Force AWS Naming Standards
date: 2020-07-27 15:33:10
tags:
  - aws
  - cloudformation
  - standards
---
# Don't Force AWS Naming Standards

When deploying in a cloud environment having some level of standards are an important thing. The cloud gives its users a lot of power to create and sometimes that can get out of hand. Being able to identify and track the purpose, environment and cost center of a resource are all important. However, the specific _name_ of a resource isn't that critical.

I think first it should be addressed _why_ people want naming standards. I'll focus on AWS because that is what I am familiar with. In the AWS web console it can be hard to identify resources based off these dimensions. The best way to do it is via tagging but they also offer a way to name resources. This is sometimes the same as tagging and sometimes different. Within AWS there are some really good services that handle naming and tagging well. For example, EC2 instances, they are named based off the `Name` tag value. Multiple resources can have the same name without conflict and it is easily searchable. Works great. A bad example is S3, bucket names there are unique, not based off tags, and while searchable, the experience isn't great. There are reasons why this is the case due to how S3 works but it makes people make assumptions about naming things they shouldn't.

Frequently when generating AWS resources via automation like CloudFormation, CDK or terraform they handle automatic name generation for you. Instead of naming resources attention should be focused on tagging standards and enforcement of those standards. With this method you don't care what the resource is named, which is the way it should be in a [cattle type environment](https://devops.stackexchange.com/a/654) (as opposed to treating resources like [pets](https://www.youtube.com/watch?v=H833o5lnB2E)).

AWS should do a better job of promoting this as well. I mentioned EC2 instances as a good example. If AWS made tags a first class citizen in the console with filtering based on tags in all parts of the console this would be a lot more intuitive. I hope they will continue to improve the console going forward.
