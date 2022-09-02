---
title: Terraform Ecosystem
date: 2022-09-02 09:10:39
tags:
- terraform
- aws
- tools
---

# The Terraform Ecosystem

I've started a new position and with that comes new tools and new responsibilities. One new tool I am using more than ever is [Terraform], which I have a new appreciation for. Not because of the tool itself, terraform is a pretty basic IaC tool. But instead I've really enjoyed the ecosystem that has developed in the past few years around it. I'd used terraform in the 2017-2018 time frame but the open source culture has embraced it and created a lot of nice tools for it. I'll outline some of them here.

My prior experience with IaC has primarily been with either CloudFormation or CDK, both of which I enjoy. So I'll be contrasting some of what [Terraform] offers with those.

## [Terraform Docs](https://terraform-docs.io/user-guide/introduction/)

`terraform-docs` is a tool used to automatically create documentation for terraform modules. I've used it in conjunction with [Anton Babenko's](https://github.com/antonbabenko) excellent [terraform pre-commit hooks](https://github.com/antonbabenko/pre-commit-terraform). Essentially including a `.pre-commit-config.yaml` with the proper config will let you automatically fill-in a given placeholder in your `README.md` file with inputs, outputs and resources from terraform.

Placeholder:
```markdown
<!-- BEGINNING OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
<!-- END OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
```

Then gets filled in with something like this:

```markdown
<!-- BEGINNING OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~>4.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_archive"></a> [archive](#provider\_archive) | 2.2.0 |
| <a name="provider_aws"></a> [aws](#provider\_aws) | 4.28.0 |

## Modules

No modules.

## Resources
...

## Inputs
...

## Outputs
...
<!-- END OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
```

With the given pre-commit hook this is done automatically on commit. So it is easy to use. The closes comparison I can think of this was an internal tool a colleague developed for CloudFormation or [jssi-doc](https://github.com/cdklabs/jsii-docgen) for CDK. Both those are either more difficult to maintain or require more input to work properly.

## [Infracost](https://www.infracost.io/)

`infracost` is a tool used to predict the cost of resources deployed to a given cloud environment before actual deployment. I am unaware of other similar tools for CloudFormation or CDK that offer this. So far my approach has either been to deploy something I know what be expensive and see what the cost is, or try to estimate it myself based on the resources defined. Doing that can be tedious.

Example output:

```bash
infracost breakdown --path=.

Evaluating Terraform directory at .
  ✔ Downloading Terraform modules
  ✔ Evaluating Terraform directory
  ✔ Retrieving cloud prices to calculate costs

Project: .

 Name                                                 Monthly Qty  Unit                        Monthly Cost

 aws_cloudwatch_metric_alarm.site_alarm
 └─ Standard resolution                                         1  alarm metrics                      $0.10

 aws_s3_bucket.canary_bucket
 └─ Standard
    ├─ Storage                                Monthly cost depends on usage: $0.023 per GB
    ├─ PUT, COPY, POST, LIST requests         Monthly cost depends on usage: $0.005 per 1k requests
    ├─ GET, SELECT, and all other requests    Monthly cost depends on usage: $0.0004 per 1k requests
    ├─ Select data scanned                    Monthly cost depends on usage: $0.002 per GB
    └─ Select data returned                   Monthly cost depends on usage: $0.0007 per GB

 aws_sfn_state_machine.sfn_state_machine
 └─ Transitions                               Monthly cost depends on usage: $0.025 per 1K transitions

 aws_sns_topic.email_notify
 ├─ API requests (over 1M)                    Monthly cost depends on usage: $0.50 per 1M requests
 ├─ HTTP/HTTPS notifications (over 100k)      Monthly cost depends on usage: $0.06 per 100k notifications
 ├─ Email/Email-JSON notifications (over 1k)  Monthly cost depends on usage: $2.00 per 100k notifications
 ├─ Kinesis Firehose notifications            Monthly cost depends on usage: $0.19 per 1M notifications
 ├─ Mobile Push notifications                 Monthly cost depends on usage: $0.50 per 1M notifications
 ├─ MacOS notifications                       Monthly cost depends on usage: $0.50 per 1M notifications
 └─ SMS notifications (over 100)              Monthly cost depends on usage: $0.75 per 100 notifications

 OVERALL TOTAL                                                                                        $0.10
──────────────────────────────────
9 cloud resources were detected:
∙ 4 were estimated, 3 of which include usage-based costs, see https://infracost.io/usage-file
∙ 3 were free, rerun with --show-skipped to see details
∙ 2 are not supported yet, rerun with --show-skipped to see details
```

The only downside to using this tool is it does require a login to hit their cloud cost api. So far I've just used the free tier of it and it works well enough. Since much of AWS and other cloud providers are built upon consumption based pricing it clearly has limitations but at least gives a good starting point of expected costs to be incurred. I haven't used it yet but you [can also integrate with](https://www.infracost.io/docs/features/cost_policies/) [opa](https://www.openpolicyagent.org/) or [Sentinel](https://www.terraform.io/cloud-docs/sentinel) policy tools to fail builds if cost is expected to grow beyond pre-approved amounts.

## Policy-As-Code Tools [Checkov](https://www.checkov.io/) & [tfsec](https://aquasecurity.github.io/tfsec/)

`checkov` and `tfsec` are both tools used to enforce policies on terraform projects. `checkov` is a more generic tool that supports other IaC formats but `tfsec` is specific to terraform. From what I have seen both work well and offer the ability to create custom checks. `checkov` offers more flexibility in custom checks, allowing YAML or Python to define the custom rules. I'll focus on `checkov` since I am slightly more familiar than it.

```bash
checkov --framework=terraform -d .

Passed checks: 9, Failed checks: 7, Skipped checks: 0

Check: CKV_AWS_61: "Ensure AWS IAM policy does not allow assume role permission across all services"
        PASSED for resource: aws_iam_role.step_function_role
        File: /main.tf:44-78
        Guide: https://docs.bridgecrew.io/docs/bc_aws_iam_45

...

Check: CKV_AWS_26: "Ensure all data stored in the SNS topic is encrypted"
        FAILED for resource: aws_sns_topic.email_notify
        File: /main.tf:1-1
        Guide: https://docs.bridgecrew.io/docs/general_15

                1 | resource "aws_sns_topic" "email_notify" {}

Check: CKV2_AWS_6: "Ensure that S3 bucket has a Public Access block"
        FAILED for resource: aws_s3_bucket.canary_bucket
        File: /main.tf:80-82
        Guide: https://docs.bridgecrew.io/docs/s3-bucket-should-have-public-access-blocks-defaults-to-false-if-the-public-access-block-is-not-attached

                80 | resource "aws_s3_bucket" "canary_bucket" {
                81 |   force_destroy = true
                82 | }
```

Of course like so many other tools this can be embedded in CI/CD pipelines to help ensure policies are being met. `checkov` also supports outputting in popular test framework formats like junit ([Example with Jenkins](https://www.checkov.io/4.Integrations/Jenkins.html)). There are similar tools for CFN and CDK. `checkov` actually works wit both of them already. There is also tools like `cfn-lint` and `cfn-guard` from AWS that can be used. There is a lot of flexibility in this space which is appreciated.

## What do I miss?

There is one key thing I miss from CDK that I haven't found a good replacement for within Terraform yet, and that is permission management for resources. [CDK offers the ability to use `grant()` functions on resources to allow principals access to defined resources.](https://docs.aws.amazon.com/cdk/v2/guide/permissions.html) This is really handy because it allows AWS to define best practices for your given resources in their L2 constructs. You can also define your own based on resources. Both CFN and terraform have the downside of needing to explicitly define the permissions for things like a Lambda needing access to an S3 bucket.

I feel like there has to be a more automated way to manage these permissions but so far the modules I've found never quite fit my expectations. The closest I've found utilizes [policy_sentry](https://github.com/salesforce/policy_sentry) but doesn't support newer version of terraform and isn't a very seamless tool. Hopefully as this space continues to mature something will come about 😄.

## Conclusion

Lots of nice tools available for terraform and it is really pushing the status quo forward. I hope to do deep dive on each of these tools as I get more familiar with them.


[Terraform]: https://www.terraform.io/
