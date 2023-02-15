---
title: Test Terraform with Jest snapshots
date: 2023-02-15 13:34:20
tags:
    - testing
    - jest
    - terraform
---

Usually when creating a Terraform module you start with the defacto standard of a `main.tf` file. As things grow maybe you will add in a `variables.tf` or `outputs.tf` file. Terraform treats these all as if they were a single file. As things grow it can be helpful to start structuring things in related files.

Maybe I have an S3 bucket with some related resources that I want to move from `main.tf` to `s3.tf`. How can I validate that I haven't copy/pasted in error? Sure I can deploy and test it, but my changes are really minor. Is there an easy way to validate this type of change? Yes, there is.

## Jest + Terraform

Utilizing Jest we can take a snapshot of the current state of our Terraform files, concat them together into a single JSON file and compare them with previous values to make sure it works.

### Getting Started

First we need to install Jest and some other required tools:

```bash
npm init -y
npm install -D @cdktf/hcl2json typescript ts-jest @types/jest ts-node
tsc --init
mkdir __tests__
touch __tests__/index.test.ts
touch jest.config.ts
```

Next we need to setup a config file for Jest. So add the following to the `jest.config.ts` file.

```typescript jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
};
```

We'll be using another library from CDKTF called [@cdktf/hcl2json](https://www.npmjs.com/package/@cdktf/hcl2json) to convert our HCL Terraform files to JSON for testing. So in the `__tests__/index.test.ts` file we'll add the following:

```typescript index.test.ts
import * as hcl from "@cdktf/hcl2json";

describe("Terraform Snapshot", () => {
    it("Should have resources with required properties", async () => {
        const data = await hcl.convertFiles(".");
        expect(data).toMatchSnapshot();
    });
});
```

And we can generate our first snapshot:

```bash
npx jest --updateSnapshot
```

This will generate a new directory and file under `__tests__`. The new `index.test.ts.snap` file will contain the JSON representation of your Terraform files all together.

```
__tests__
├── __snapshots__
│   └── index.test.ts.snap
└── index.test.ts
```

Now I can move resources around. In my example this is my original `main.tf` file:

```hcl main.tf
resource "null_resource" "resource1" {}
resource "null_resource" "resource2" {}
resource "null_resource" "resource3" {}

resource "aws_s3_bucket" "test_bucket" {}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.test_bucket.id

  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "bucket_encryption" {
  bucket = aws_s3_bucket.test_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "block_public_access" {
  bucket = aws_s3_bucket.test_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

Now I'll move my S3 resources to a separate file called `s3.tf`:

```hcl main.tf
resource "null_resource" "resource1" {}
resource "null_resource" "resource2" {}
resource "null_resource" "resource3" {}
```

```hcl s3.tf
resource "aws_s3_bucket" "test_bucket" {}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.test_bucket.id

  versioning {
    enabled = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "bucket_encryption" {
  bucket = aws_s3_bucket.test_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "block_public_access" {
  bucket = aws_s3_bucket.test_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

And I can run a test to ensure Terraform still works as expected:

```bash
npm test

> terraform-jest-testing@1.0.0 test
> jest

 PASS  __tests__/index.test.ts
  Terraform Snapshot
    ✓ Should have resources with required properties (89 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   1 passed, 1 total
Time:        0.572 s, estimated 1 s
Ran all test suites.
```

Now I can move around resources, data lookups outputs and variables to my hearts content and still validate the results are the same. If I ever need to update snapshots I can re-run the `npx jest --updateSnapshot` command, compare the new vs old snapshot it git and consider it good.
