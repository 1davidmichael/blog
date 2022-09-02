---
layout: blog
title: Fargate + EFS DNS issue and resolution
date: 2021-02-08 14:54:25
tags:
- aws
- ecs
- fargate
- dns
- cdk
---

Up until the recent past, if you wanted to use persistent storage with Fargate your only option was to use S3 or some other object store and not persist data in your container. But now, [Fargate supports EFS mounts](https://aws.amazon.com/about-aws/whats-new/2020/04/amazon-ecs-aws-fargate-support-amazon-efs-filesystems-generally-available/), which is great. You can persist files to the mount, your containers can come and go.

As I prepared to deploy this for workloads for my employer I encountered an issue... The containers wouldn't start because the mount couldn't _mount_. The cause?!

{% asset_img dns.png Its always DNS %}

The errors made it pretty obvious, the DNS for `fs-abcd1234.efs.us-east-1.amazonaws.com` could not be resolved. For these AWS accounts external AD resovlers are used in a shared account. Cross-account looks for EFS mounts do not work, even if using Transit Gateway or VPC peering. The given solution is to mount by IP, not by filesystem-id, or edit `/etc/hosts`. But that isn't possible with Fargate, the hosts file is maintained by AWS and you have to provide a file system id for mounting. To resolve this there were both short-term and long-term solutions.

## Short Term Fix

For the short-term solution we abandoned using Fargate and stuck with ECS on EC2 instances. This allowed us to modify our own `/etc/hosts` file in the user-data on boot with a script similar to this:

```bash
set -xe
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
yum install -y jq awscli
export AVAILABILITY_ZONE=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)
export IP=$(aws efs describe-mount-targets --file-system-id $FILESYSTEM_ID --region us-east-1 \
    | jq -r --arg AVAILABILITY_ZONE "$AVAILABILITY_ZONE" '.MountTargets[] | select(.AvailabilityZoneName==$AVAILABILITY_ZONE).IpAddress')
printf "$IP $FILESYSTEM_ID.efs.us-east-1.amazonaws.com\n" >> /etc/hosts
```

Now trying to mount EFS via the containers worked as expected. There are some downsides though.

* Every EFS volume has to be added to the hosts, so if we have just a few services it isn't a bit deal, but as we scale it becomes unmanageable.
* We have to maintain the EC2 instances, which is something we want to avoid and thus prefer Fargate.

This brings me to...

## Long Term Fix

The longer term fix is to resolve the issues with DNS resolution but still allow us to use our internal AD DNS servers. Once again, until semi-recently this wasn't possible, but now [Route 53 Resolvers are available](https://aws.amazon.com/about-aws/whats-new/2018/11/amazon-route-53-announces-resolver-with-support-for-dns-resolution-over-direct-connect-and-vpn/).
The solution was to utilize them in a way that all lookup traffic goes to our internal DNS resolvers except for `amazonaws.com` lookups.

To accomplish this in a shared account outbound resolvers and rules for `.` and `amazonaws.com` were created. Then using [RAM](https://docs.aws.amazon.com/ram/latest/userguide/what-is.html) the resolvers were shared with all other accounts in our org that were part of the same network and the VPC DHCP option sets were updated to use internal VPC resolvers. Now we could resolve EFS endpoints and DNS still worked as expected. This has the added benefit of making DNS resolution more robust ([See here](https://www.youtube.com/watch?v=_Z5jAs2gvPA) for details).

**Example CFN:**

```yaml
Resources:
  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow outbound requests to shared account DNS
      SecurityGroupEgress:
        - IpProtocol: "-1"
          CidrIp: 0.0.0.0/0
      SecurityGroupIngress:
        - IpProtocol: "-1"
          ToPort: 53
          CidrIp: 0.0.0.0/0
      VpcId: !ImportValue Vpc

  OutboundEndpoint:
    Type: AWS::Route53Resolver::ResolverEndpoint
    Properties:
      IpAddresses:
        - SubnetId: !ImportValue SubnetPrivate1a
        - SubnetId: !ImportValue SubnetPrivate1b
        - SubnetId: !ImportValue SubnetPrivate1c
      Direction: OUTBOUND
      SecurityGroupIds:
        - !Ref SecurityGroup

  AwsDomainResolverRule:
    Type: AWS::Route53Resolver::ResolverRule
    Properties:
      DomainName: amazonaws.com
      RuleType: SYSTEM

  DefaultDomainResolverRule:
    Type: AWS::Route53Resolver::ResolverRule
    Properties:
      DomainName: .
      RuleType: FORWARD
      ResolverEndpointId: !GetAtt OutboundEndpoint.ResolverEndpointId
      TargetIps:
        - Ip: 10.2.0.1
        - Ip: 10.2.0.2

  AWSResolverRuleAssociation:
    Type: AWS::Route53Resolver::ResolverRuleAssociation
    Properties:
      VPCId: !ImportValue Vpc
      ResolverRuleId: !GetAtt AwsDomainResolverRule.ResolverRuleId

  DefaultResolverRuleAssociation:
    Type: AWS::Route53Resolver::ResolverRuleAssociation
    Properties:
      VPCId: !ImportValue Vpc
      ResolverRuleId: !GetAtt DefaultDomainResolverRule.ResolverRuleId

  RAM:
    Type: AWS::RAM::ResourceShare
    Properties:
      Name: Route53Resolvers
      Principals:
        - <organization arn>
      ResourceArns:
        - !GetAtt AwsDomainResolverRule.Arn
        - !GetAtt DefaultDomainResolverRule.Arn
```

Now we can keep our DNS config, use Fargate (and Lambda!) with EFS and this will probably resolve issues with other services we have yet to discover. Now the only thing left to do is convert the ECS services we have to use Fargate, which given we are using [cdk ecs-patterns](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-ecs-patterns-readme.html) will be pretty straight forward. Just make sure you use version 1.4 of the Fargate platform.
