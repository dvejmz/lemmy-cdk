import { Construct } from "constructs";
import { Port, Vpc } from "aws-cdk-lib/aws-ec2";
import { FileSystem, LifecyclePolicy, PerformanceMode } from "aws-cdk-lib/aws-efs";
import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import { Bastion } from "./bastion";
import { SiteCDN } from "./cdn";
import { siteConfig } from "./config";
import { Database } from "./database";
import { DNS } from "./dns";
import { LemmyECS } from "./lemmy/ecs";
import { LemmyLoadBalancer } from "./lemmy/loadbalancer";

export class Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new Vpc(this, "VPC", {
      // increase this if you want to be highly available. costs more.
      natGateways: 1,
    });

    // DB
    const db = new Database(this, "DB", {
      vpc,
    });

    // Bastion host
    let bastion;
    if (siteConfig.bastionKeypairName) {
      bastion = new Bastion(this, "Bastion", { vpc });
      db.securityGroup.addIngressRule(bastion.securityGroup, Port.tcp(5432));
    }

    // EFS - storage for files
    const fs = new FileSystem(this, "FS", {
      vpc,
      encrypted: true,
      lifecyclePolicy: LifecyclePolicy.AFTER_60_DAYS,
      performanceMode: PerformanceMode.GENERAL_PURPOSE,
      removalPolicy: RemovalPolicy.RETAIN,
      fileSystemName: "LemmyFS",
      enableAutomaticBackups: false,
    });

    // ALBs
    const lemmyLoadBalancer = new LemmyLoadBalancer(this, "LemmyLoadBalancer", {
      vpc,
    });

    // CDN
    const cdn = new SiteCDN(this, "CDN", {
      lemmyLoadBalancer,
    });

    // DNS
    const domain = new DNS(this, "DNS", {
      lemmyLoadBalancer: lemmyLoadBalancer.alb,
      bastion,
      cdn,
    });

    // ECS
    const ecs = new LemmyECS(this, "LemmyECS", {
      vpc,
      fs,
      lemmyLoadBalancer,
      db: db.cluster,
      dbSecurityGroup: db.securityGroup,
    });
  }
}
