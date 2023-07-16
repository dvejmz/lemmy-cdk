import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import * as core from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";
import { Bastion } from "./bastion";
import { SiteCDN } from "./cdn";
import { siteConfig } from "./config";
import { LemmyDomain } from "./lemmy/dns";
import { RootRedirect } from "./root-redirect";

interface IDomainProps {
  lemmyLoadBalancer: ApplicationLoadBalancer;
  bastion?: Bastion;
  cdn: SiteCDN;
}

export class DNS extends Construct {
  constructor(
    scope: Construct,
    id: string,
    { lemmyLoadBalancer, bastion, cdn }: IDomainProps
  ) {
    super(scope, id);

    const zone = HostedZone.fromLookup(this, "HostedZone", {
      domainName: siteConfig.siteDomainName,
    });

    // CDN DNS (for www. and api.)
    new LemmyDomain(this, "Lemmy", { cdn, zone, lemmyLoadBalancer });

    // root domain - redirects to www.
    new RootRedirect(this, "RootRedirect", { zone });

    // bastion DNS
    if (bastion)
      new ARecord(this, "BastionRecord", {
        zone,
        target: RecordTarget.fromIpAddresses(bastion.elasticIp.ref),
        comment: "Bastion",
        recordName: "bastion",
        ttl: Duration.minutes(30),
      });
  }
}
