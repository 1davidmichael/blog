import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as certmanager from '@aws-cdk/aws-certificatemanager';
import * as route53 from '@aws-cdk/aws-route53';


export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: 'dmichael.be',
      privateZone: false
    });

    const websiteBucket = new s3.Bucket(this, "static-website-bucket", {
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html"
    });

    const certificate = new certmanager.DnsValidatedCertificate(this, "Certificate", {
      domainName: 'blog.dmichael.be',
      hostedZone
    });

    const cloudfrontDistributio = new cloudfront.CloudFrontWebDistribution(this, "CloudFront", {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: websiteBucket,
          },
          behaviors: [
            {
              isDefaultBehavior: true
            }
          ]
        }
      ]
    });
  }
}
