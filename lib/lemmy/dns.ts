import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {
  AaaaRecord,
  ARecord,
  IHostedZone,
  RecordTarget,
} from "aws-cdk-lib/aws-route53";
import {
  CloudFrontTarget,
  LoadBalancerTarget,
} from "aws-cdk-lib/aws-route53-targets";
import * as core from "aws-cdk-lib";
import { SiteCDN } from "../cdn";

interface IDomainProps {
  zone: IHostedZone;
  cdn: SiteCDN;
  lemmyLoadBalancer: ApplicationLoadBalancer;
}
export class LemmyDomain extends Construct {
  constructor(
    scope: Construct,
    id: string,
    { zone, cdn, lemmyLoadBalancer }: IDomainProps
  ) {
    super(scope, id);

    // CDN target
    const cdnTarget = RecordTarget.fromAlias(
      new CloudFrontTarget(cdn.distribution)
    );
    const apiTarget = RecordTarget.fromAlias(
      new LoadBalancerTarget(lemmyLoadBalancer)
    );

    // N.B. root DNS lives in root-redirect

    // API
    new ARecord(this, "LemmyAPIAWebRecord", {
      zone,
      target: apiTarget,
      comment: "Lemmy API",
      recordName: "api",
    });
    new AaaaRecord(this, "LemmyAPIAAAAWebRecord", {
      zone,
      target: apiTarget,
      comment: "Lemmy API",
      recordName: "api",
    });

    // www
    new ARecord(this, "LemmyWWWARecord", {
      recordName: "www",
      target: cdnTarget,
      zone,
      comment: "Site CloudFront",
    });
    new AaaaRecord(this, "LemmyWWWAAAARecord", {
      recordName: "www",
      target: cdnTarget,
      zone,
      comment: "Site CloudFront",
    });
  }
}
