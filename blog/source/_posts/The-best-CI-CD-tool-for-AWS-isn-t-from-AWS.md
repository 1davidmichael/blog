---
layout: blog
title: The best CI/CD tool for AWS isn't from AWS
date: 2021-10-18 21:50:56
tags:
- aws
- github
- ci/cd
- git
---

There are all kinds of build and deployment tools, especially for cloud environments and it seems like every cloud provider has their own. For AWS, one might think their suite of tools is best. But surprisingly, in my opinion, the best tool for AWS comes from a direct cloud competitor. Even more surprising, AWS seems to know this and treats it often times better than their own solutions. Unsurprisingly, this competitor is [GitHub], now a Microsoft owned product.
In this post I'll dig into why I think GitHub is superior over AWS's offerings and how it can be best utilized.

## Git Experience

It shouldn't be too surprising that [GitHub] wins in the git user experience area. It has long been a defacto standard web interface for many open source projects and after Microsoft's acquisition they have expanded the enterprise capabilities. This includes integrating it with Azure AD, Okta, MFA requirements and org/team management. In addition, the PR and code review process is excellent. Users have the ability to customize reviewers on pull requests, even down to a file level. Customize notifications and even do advanced triage via GitHub Actions. The whole thing has really advanced and is now not just a pretty git web ui with some PR capabilities.

One of the features I especially like is the integration with various GitHub apps like [Probot Settings](https://github.com/probot/settings). The tool allows you to configure your GitHub repo settings via code and manage changes via PR. Suddenly with a simple [repo template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository) you can help establish best practices across your organization.

{% asset_img image1.png GitHub PR Experience %}

Now let's look at AWS's [CodeCommit]. As a git web interface, its passable. It does the job but without a lot of assistance and features from AWS. Even [configuring users via federation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_ssh-keys.html#access-keys-code-commit) is a pain. There are a few nice integrations, it works natively without any setup for CodeGuru, and you can even wire up Lambdas and other things to trigger on events. But all of those are done outside of the code repo or require some bootstrap setup. Approval rules are there, but based on IAM username, group or role.

If you want to have a public repo, well you are better of just using GitHub, because there is no real option for a public repo in [CodeCommit]. Hell, even AWS primarily uses GitHub for its [many](https://github.com/aws/) [open](https://github.com/aws-cloudformation) [source](https://github.com/awsdocs) [projects](https://github.com/aws-samples).

Like I said, its passable. It works, but in the age of agile, all these small things that require configuration and setup on undifferentiated heavy lifting is usually wasted time spent not working on new features or fixes.

{% asset_img image2.png CodeCommit PR Experience %}

## CI/CD

For Continuous Integration/Deployment, GitHub Actions is a tool that really works well. AWS's alternative works, but as is the case in some many tools, it is just more difficult to get started with. I'll dive in a bit more into each of them, focusing on Actions first.

To best sum up Actions, it is a way to trigger a predefined workflow when a given event happens in a repo. This should sound pretty similar to AWS's serverless, event based architecture, but this is focused on a GitHub repository. So if a commit is pushed, a PR created or release a workflow, defined as a Dockerfile with an entrypoint can be triggered and executed. There is functionality to run these in parallel, wait for input, create releases and do anything else you want. They are incredibly powerful and flexible with many pre-canned solutions available both from GitHub and [direct from AWS themselves](https://github.com/aws-actions). I think AWS publishing their own actions is a testament to its usefulness and popularity.

All of this is defined as a YAML file within a `.github/workflows` directory in a given repository. You can even have custom workflows in a repo or share them privately across an organization. This allows repeatable patterns to easily be shared across teams.

[Example AWS Credentials Action](https://github.com/aws-actions/configure-aws-credentials):

{% asset_img image3.png GitHub Actions YAML %}

AWS's alternative is fundamentally two different services, [CodeBuild] and [CodePipeline]. CodeBuild uses to build the software, and CodePipeline used to deploy it to given environments.

[CodeBuild] fundamentally works the same way as [GitHub Actions], just with more setup. A developer has to link a repo, either in CodeCommit, GitHub or BitBucket Cloud, to it. Then a `buildspec.yml` file can be added to the repo and configured when to build. The results can then be passed off to [CodePipeline] to deploy to different environments. CodePipeline works well because it can be configured to use multiple roles to deploy to multiple AWS accounts. Using something like [CDK Pipelines] you can even configure it to be self-mutable, but the issue is it still requires setup that adds to the time it takes to get code shipped. There are not many pre-configured CodeBuild steps, so you might likely be reconfiguring the same steps over and over again unless you introduce your own automation. Once again, it all works, but GitHub's solutions are easier.

## Bonus GitHub features

{% asset_img image4.png GitHub PR Review %}


One new thing I very recently became aware of that is an excellent feature of GitHub is its integration with Visual Studio Code. For example, going to a Pull Request, and then typing `.` will open the PR in a full web version of VS Code. This is a great way to better review code and really show the changes in their full form. Quality of life things like this are why I really like GitHub.



## Conclusion

Overall, both tools work and work well. The fundamental difference is community support and ease of use. Both of which I think [GitHub] wins, hands down. While it is certainly the more expensive of the two, I could argue that the increased productivity and reduced time spent on re-work is worth it.

[GitHub]: https://github.com
[CodeCommit]: https://aws.amazon.com/codecommit/
[GitHub Actions]: https://github.com/features/actions
[CodeBuild]: https://aws.amazon.com/codebuild/
[CodePipeline]: https://aws.amazon.com/codepipeline/
[CDK Pipelines]: https://aws.amazon.com/blogs/developer/cdk-pipelines-continuous-delivery-for-aws-cdk-applications/