import {
  Stack,
  StackProps,
  CfnParameter,
  RemovalPolicy,
  Duration,
  CfnOutput
} from 'aws-cdk-lib';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as certmanager from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

import { Construct } from 'constructs';


export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const uploadBuckeName = new CfnParameter(this, "BucketName", {
      type: "String",
      description: "The name of the bucket to be used",
      default: "david-michael-blog-bucket"
    });

    const subdomain = new CfnParameter(this, "Subdomain", {
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
      removalPolicy: RemovalPolicy.DESTROY,
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
              defaultTtl: Duration.minutes(5),
              maxTtl: Duration.minutes(5)
            }
          ]
        }
      ],
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(
        certificate,
        {
          aliases: [`${subdomain.valueAsString}.dmichael.be`],
        }
      ),
      loggingConfig: {
        bucket: logBucket
      }
    });

    const dnsRecord = new route53.ARecord(this, "Route53Record", {
      zone: hostedZone,
      recordName: `${subdomain.valueAsString}.dmichael.be`,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cloudfrontDistribution))
    });

    const output = new CfnOutput(this, "S3BucketOutput", {
      value: websiteBucket.bucketName
    });
  }
}
