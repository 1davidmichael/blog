---
title: Terraform External Data Provider and local-exec Provisioner
date: 2022-09-28 09:44:44
tags:
- terraform
- aws
- serverless
---

Recently while working with creating my own Terraform lambdas I wanted to try to create some similar deployment functionality to [AWS SAM] or [serverless.tf]. The functionality is this:

_The code for infrastructure and business logic is stored side-by-site and when business-logic code changes, only then is it deployed out. If you update infrastructure, but the code remains the same, no need to recompile and push._

This greatly reduces time to deploy changes, especially if there are larger projects with multiple lambdas and only one is changing. So, **how can we do this in our own terraform module?**

Well first lets look at how this works within the [serverless.tf] provided [serverless-aws-lambda module](https://github.com/terraform-aws-modules/terraform-aws-lambda). The meat of this is done in two related files called `package.tf` and `package.py`.

## Determine Packaging

The first thing to checkout is the [`archive_prepare`](https://github.com/terraform-aws-modules/terraform-aws-lambda/blob/master/package.tf#L7-L42) external data source. Keep in mind, within terraform, external data is run on every apply. This resource calls the `package.py` python script with the argument `prepare`. External data providers also receive any query data via stdin. The script is invoked and runs the method [prepare_command method](https://github.com/terraform-aws-modules/terraform-aws-lambda/blob/master/package.py#L1151). According to the comment it does this:

> Generates a content hash of the source_path, which is used to determine if the Lambda code has changed, ignoring file modification and access times. Outputs a filename and a command to run if the archive needs to be built.

```python
def prepare_command(args):
# ...
    # Output the result to Terraform.
    json.dump({
        'filename': filename,
        'build_plan': build_plan,
        'build_plan_filename': build_plan_filename,
        'timestamp': str(timestamp),
        'was_missing': 'true' if was_missing else 'false',
    }, sys.stdout, indent=2)
    sys.stdout.write('\n')
```

So what is output is a `filename`, `build_plan`, `build_plan_filename`, `timestamp` and `was_missing` bool. All used by later steps to determine how the packaging will work and where it will be output.

## Do the Packaging

With this info, terraform can now determine if packaging is needed for the lambda and how to go about it. Supported bundling of dependencies is supported by Python or Javascript. The `package.py` is a very complex script, so I won't go into details, but it handles the packaging via a `local-exec` call.

```hcl
# Build the zip archive whenever the filename changes.
resource "null_resource" "archive" {
  count = var.create && var.create_package ? 1 : 0

  triggers = {
    filename  = data.external.archive_prepare[0].result.filename
    timestamp = data.external.archive_prepare[0].result.timestamp
  }

  provisioner "local-exec" {
    interpreter = [
      local.python, "${path.module}/package.py", "build",
      "--timestamp", data.external.archive_prepare[0].result.timestamp
    ]
    command = data.external.archive_prepare[0].result.build_plan_filename
  }

  depends_on = [local_file.archive_plan]
}
```

Here if the output of `package.py prepare` results in a change it will trigger this `null_resource` and the `local-exec`. That `local-exec` will install dependencies and copy them and the lambda code into the provided archive. That can then be transferred to AWS via the [`aws_lambda_function`](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function)resource.

## Package Summary

To summarize it this is the flow:

1. Review code location for changes via external data provider
1. Trigger `local-exec` if the data provider shows a change. This creates the lambda zip
1. Upload lambda zip via `aws_lambda_function`

## What If...

So this works great, but what if we wanted to do a non-Python/Javascript lambda? And not mess with the complexity of the `package.py` file? It isn't too bad. Here are some snippets of an example using Dotnet, Bash and Terraform. The samples of the code below can be found in a GitHub repo here: <https://github.com/1davidmichael/terraform-aws-dotnet-lambda>

First the terraform, we use an external data provider + bash script to see if the source directory contents has changed via a hash. Then we use a `null_resource` `local-exec` triggered off the `data.external.build_folder` to build the lambda zip.

```terraform main.tf
# Outputs the following:
# location = output bundle file
# hash = mmd5sum of the bundle file
data "external" "build_folder" {
  program = ["bash", "${path.module}/bin/folder_contents.sh"]
  query = {
    output_dir    = local.output_dir
    code_location = var.code_location
  }
}

# Build lambda when contents of the directory have changed
resource "null_resource" "create_package" {
  triggers = {
    output_file_location = data.external.build_folder.result.location
  }

  provisioner "local-exec" {
    command = "${path.module}/bin/package.sh ${data.external.build_folder.result.location} ${var.code_location} ${var.architecture}"
  }
}
```

The bash script `folder_contents.sh` checks the md5sums of all files in the directory and uses that to generate a single hash value and output the zip location and hash via json back to terraform.
Note that everything output must be json or terraform chokes. So all output to stdout has to be redirected to stderr except the json output.

```bash folder_contents.sh
#!/bin/bash -ex
# shellcheck disable=SC2016,SC2288,SC2154

eval "$(jq -r '@sh "export code_location=\(.code_location) output_dir=\(.output_dir)"')"

# Linux has command md5sum and OSX has command md5
if command -v md5sum >/dev/null 2>&1; then
  MD5_PROGRAM=md5sum
elif command -v md5 >/dev/null 2>&1; then
  MD5_PROGRAM=md5
else
  echo "ERROR: md5sum is not installed"
  exit 255
fi

# Take md5 from each object inside the program and then take a md5 of that output
MD5_OUTPUT="$(find "$code_location" -type f -print0| xargs -0 $MD5_PROGRAM | $MD5_PROGRAM | awk '{ print $1 }' )"

# Output result as JSON back to terraform
jq --null-input \
  --arg location "$output_dir/$MD5_OUTPUT.zip" \
  --arg hash "$MD5_OUTPUT" \
  '{"location": $location, "hash": $hash}'
```

Using the info provided from terraform and the `folder_contents.sh` script we use the dotnet CLI to create a lambda zip.

```bash package.sh
#!/bin/bash -e

OUTPUT_FILE="$1"
CODE_LOCATION="$2"
ARCHITECTURE="$3"

dotnet lambda package \
  -o "$OUTPUT_FILE" \
  -pl "$CODE_LOCATION" \
  -farch "$ARCHITECTURE"
```

Now we just use the typical AWS terraform resources to create our lambda and we are good to go with a basic Dotnet lambda! Best of all, the lambda zip in AWS will only be updated when files have changed. There are some limits to this but it is overall very straightforward.


[AWS SAM]: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html
[serverless.tf]: https://serverless.tf/
