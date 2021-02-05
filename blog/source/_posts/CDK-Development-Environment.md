---
layout: blog
title: CDK Development Environment
date: 2021-02-05 10:00:42
tags:
    - aws
    - cdk
    - vscode
    - python
    - typescript
---

The CDK despite being fairly new has a lot of benefits in that you can use the same tools, processes and editors you would use for typical language development. I primarily work with CDK in `python` and `typescript` and wanted to share a bit about what I use.

## Editor/IDE

For a long time I was a big vim fan, I still use it frequently but my go to editor is now [Visual Studio Code](https://code.visualstudio.com/). There are a few reasons for doing this.

1. Cross-OS ease of development - With my current position I use a Windows laptop for development of Python CDK but am able to use [WSL](https://docs.microsoft.com/en-us/windows/wsl/about) for a Linux type environment locally. This integrates well with Code and I can directly open into WSL using the `code .` terminal command.
1. Intellisense - Code completion with Intellisense for both Python and Typescript works very well with the CDK and helps me avoid checking documentation in my browser frequently.
1. Community - Both at my job and in the wider development community there are many Code users and the AWS Toolkit plugin for it even has some built in CDK functionality with the [CDK Explorer](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/cdk-explorer.html)

### Useful VS Code Plugins

* [AWS Toolkit](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html)
* [Remote Containers](https://code.visualstudio.com/blogs/2020/07/01/containers-wsl)
* [Python](https://code.visualstudio.com/docs/languages/python)
* [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance)
* [Typescript](https://code.visualstudio.com/docs/languages/typescript)
* [Git Lens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) (I primarily use this for displaying git info inline and use the CLI for all other git interactions)

## Dependencies

When you first initialize a project with the `cdk` cli tool it sets up dependency handling for you using either `pip` for Python or `npm` for Typescript. This is useful for installing the various CDK libraries needed, including any custom ones. `npm` works well enough I don't foresee migrating to another solution. However, for `pip` I am considering using more robust solution.

Pip, while working, has issues where adding and managing the `requirements.txt` file is a pain. I've used pipenv in the past but that does [not support multiple Python versions](https://github.com/pypa/pipenv/issues/1050) and the owner has made it clear it probably won't be. Another popular option which is now supported by the CDK in the [aws-lambda-python construct](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-python-readme.html) is [poetry](https://python-poetry.org/).

I've used `poetry` a bit and have enjoyed it. It has a very similar syntax compared with `npm` and works well. Going forward this will be my preferred solution.

## Deployments

I've used a number of CI/CD tools for CDK deployments and by far the easiest so far has been [GitHub Actions](https://docs.github.com/en/actions). Specifically with the [AWS CDK GitHub Actions](https://github.com/marketplace/actions/aws-cdk-github-actions) action, that supports both Typescript and Python it works great out of the box. This blog is even deployed using this strategy.

Others I have used are [CDK Pipelines](https://aws.amazon.com/blogs/developer/cdk-pipelines-continuous-delivery-for-aws-cdk-applications/) which work well once setup and the self-mutating pipeline is cool but requires a lot of CDK and Codepipeline knowledge that is a pain. [Bamboo](https://www.atlassian.com/software/bamboo) is another tool I have used but I don't recommend it. There is a lot of initial setup, the Docker handling of it is poor, and it is expensive, especially for personal projects.