# David's Blog

Repository which creates a blog using [AWS CDK], [GitHub Actions] and [Hexo].

This serves as both an example of how to use the CDK as well as an
experimental use case for me.

The generated blog can be found here: <https://blog.dmichael.be>

## Development

Development for the blog can be done using the [Hexo] CLI and previewed
locally with `hexo server`.

Infrastructure development can be previewed via the `cdk synth` command.
This does require the variables `AWS_ACCOUNT_ID` and `AWS_DEFAULT_REGION`
to be set or added to a `infra/.env` file.

## Deployment

All changes to master are automatically deployed to AWS via [GitHub Actions].
I hope in the future to support preview environments.

[AWS CDK]: https://docs.aws.amazon.com/cdk/latest/guide/constructs.html
[GitHub Actions]: https://docs.github.com/en/actions
[Hexo]: https://hexo.io/
