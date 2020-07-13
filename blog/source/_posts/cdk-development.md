---
layout: blog
title: CDK Development Language
date: 2020-07-12 21:46:51
tags:
---

A few notes about working with the CDK that I have uncovered.

The first is, my preferred language is Python. It is simple, well documented and easy to learn. But when working with the CDk I have found Typescript to be my preferred langauge for a couple reasons. [CDK Documentation](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-construct-library.html)

1. The CDK Constructs made by AWS are mostly written in Typescript. So all the documentation is geared toward it and the easiest to understand. All those constructs are also transpiled into other languages for support using [jsii](https://github.com/aws/jsii)
1. The testing framework of Jest only supports Typescript currently. This makes it easy to write tests using the builtin functions. [See here for more documentation on testing CDK Constructs.](https://docs.aws.amazon.com/cdk/latest/guide/testing.html)

I haven't gotten too involved in writing constructs and I plan on doing more direct work development using Python so these may evolve over time. I have enjoyed using the CDK thus far because it makes writing repeatable CFN templates much easier than using CFN nested stacks I have previously used.

The other available languages I probably won't use given my unfamiliarity with them and the environments I work in. The only exception being C# which may come up at my day job for other groups usage.