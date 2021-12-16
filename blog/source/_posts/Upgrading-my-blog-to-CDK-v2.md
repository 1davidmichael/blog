---
layout: blog
title: Upgrading my blog to CDK v2
date: 2021-12-15 23:01:47
tags:
  - cdk
  - aws
  - cdkv2
---

I recently updated the CDK code that is used to provision AWS resources for this blog to CDK v2. I think it is worth looking at the process a bit to see what changes were made.

## Package Differences

The first thing you should be aware of with CDK v2 is it consolidates most of the CDK resource packages into a single library called [aws-cdk-lib](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib-readme.html). So the first, initial change, is to remove all `@aws-cdk/aws-*` resources from the `package.json` file. This is easiest to see in the GitHub diff [here](https://github.com/1davidmichael/blog/commit/dc6352d9cbe15bcad2649da257268f89c255f738#diff-68ab8b99cbc93323a0f4797ba07ef5c03961adf5636217a352e289c878075ec6). A new `package-lock.json` file will need to be generated from these new depencies by running an `npm install`.

Once this is complete any imports using these libraries must be updated to import them correctly. Many of these changes go from looking like this:

```typescript
import * as s3 from '@aws-cdk/aws-s3';
```

To this:

```typescript
 import * as s3 from 'aws-cdk-lib/aws-s3';
 ```

 And also any libraries part of `@aws-cdk/core` will need to be imported individually from `aws-cdk-lib`. Here is an example of that with the `Duration` class.

 ```typescript
 import { Duration } from 'aws-cdk-lib';
 ```

If you references the classes as `cdk.Duration` they will need to be modifed to remove cdk to be just `Duration`.

The `Construct` class has also been moved into its own package resource [constructs](https://docs.aws.amazon.com/cdk/api/v2/docs/constructs-readme.html) package. Any references to `cdk.Construct` will need to have both the imports and references updated.

## cdk.json Changes

There are some feature flags included in the `cdk.json` file that will need to be removed as well. These were added to CDK v1 over time and have become defaults now with v2.

```json
{
  "app": "npx ts-node bin/infra.ts",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": "true",
    "aws-cdk:enableDiffNoFail": "true"
  }
}
```

In this case both `@aws-cdk/core:enableStackNameDuplicates` and `aws-cdk:enableDiffNoFail` can be removed completely.

## Deprecated Resources

Finally, some deprecated resources have been removed with v2 and will need to be updated to migrate. The best example I have of this is the removal of [aliasConfiguration](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-cloudfront.AliasConfiguration.html) from the cloudfront resource.

In my case this was able to be replaced with the [ViewerCertificate](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-cloudfront.ViewerCertificate.html) resource. That example can be found [here](https://github.com/1davidmichael/blog/commit/dc6352d9cbe15bcad2649da257268f89c255f738#diff-4d30c26b8cfc1ca014c1890e2ca91336fbeb9b4194c1f56b2b6bb446be4c11b2)

## CDK Bootstrap

If you haven't recently done it, most AWS accounts in use may need to be re-bootstrapped. This is due to additional dependencies added to the CDK bootstrap stack deployed to AWS accounts. More details can be found [here](https://docs.aws.amazon.com/cdk/v2/guide/migrating-v2.html#migrating-v2-trouble.title). Luckily the fix if you encounter errors with the older v1 bootstrap is easy. A quick command below takes care of it:

```bash
cdk boostrap --profile <account_profile>
```

## Conclusion

This is a relatively simple CDK application so the transition from CDK v1 to v2 was easy. I have done some more complex applications for my `$DAYJOB` and even more complex ones haven't been too difficult. Overall I think the move to a single repo for most resources will be well received.
