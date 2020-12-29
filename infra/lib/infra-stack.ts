import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as certmanager from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const uploadBuckeName = new cdk.CfnParameter(this, "BucketName", {
      type: "String",
      description: "The name of the bucket to be used",
      default: "david-michael-blog-bucket"
    });

    const subdomain = new cdk.CfnParameter(this, "Subdomain", {
      type: "String",
      description: "The name of the subdomain to be used",
      default: 'blog'
    });

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: 'dmichael.be',
      privateZone: false
    });

    const websiteBucket = new s3.Bucket(this, "static-website-bucket", {
      bucketName: uploadBuckeName.valueAsString,
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html"
    });

    const certificate = new certmanager.DnsValidatedCertificate(this, "Certificate", {
      domainName: `${subdomain.valueAsString}.dmichael.be`,
      hostedZone
    });

    const logBucket = new s3.Bucket(this, "LogBucket");

    const cloudfrontDistribution = new cloudfront.CloudFrontWebDistribution(this, "CloudFront", {
      originConfigs: [
        {
          customOriginSource: {
            domainName: websiteBucket.bucketWebsiteDomainName,
            originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              defaultTtl: cdk.Duration.minutes(5),
              maxTtl: cdk.Duration.minutes(5)
            }
          ]
        }
      ],
      aliasConfiguration: {
        acmCertRef: certificate.certificateArn,
        names: [`${subdomain.valueAsString}.dmichael.be`]
      },
      loggingConfig: {
        bucket: logBucket
      }
    });

    const dnsRecord = new route53.ARecord(this, "Route53Record", {
      zone: hostedZone,
      recordName: `${subdomain.valueAsString}.dmichael.be`,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cloudfrontDistribution))
    });

    const output = new cdk.CfnOutput(this, "S3BucketOutput", {
      value: websiteBucket.bucketName
    });
  }
}