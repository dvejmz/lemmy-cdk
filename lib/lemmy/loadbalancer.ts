import { Vpc } from "@aws-cdk/aws-ec2";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  IpAddressType,
  ListenerAction,
  ListenerCondition,
  TargetType,
} from "@aws-cdk/aws-elasticloadbalancingv2";
import * as core from "@aws-cdk/core";
import { Duration } from "@aws-cdk/core";
import { siteConfig } from "../config";

interface ILBProps {
  vpc: Vpc;
}

export class LemmyLoadBalancer extends core.Construct {
  backendTargetGroup: ApplicationTargetGroup;
  frontendTargetGroup: ApplicationTargetGroup;
  alb: ApplicationLoadBalancer;

  constructor(scope: core.Construct, id: string, { vpc }: ILBProps) {
    super(scope, id);

    // ALB
    const lb = new ApplicationLoadBalancer(this, "LemmyLB", {
      vpc,
      internetFacing: true,
      http2Enabled: true,
      ipAddressType: IpAddressType.IPV4, // dual-stack would be nice, not super easy to do yet
    });

    // target group for lemmy backend
    const backendTg = new ApplicationTargetGroup(this, "LemmyBETargetGroup", {
      vpc,
      protocol: ApplicationProtocol.HTTP,
      port: 8536,
      targetGroupName: "Lemmy-Backend",
      targetType: TargetType.IP,
      healthCheck: {
        path: "/api/v2/categories",
        interval: Duration.seconds(10),
        healthyThresholdCount: 2,
      },
    });
    // target group for lemmy frontend
    const frontendTg = new ApplicationTargetGroup(this, "LemmyFETargetGroup", {
      vpc,
      protocol: ApplicationProtocol.HTTP,
      port: 1234,
      targetType: TargetType.IP,
      targetGroupName: "Lemmy-Frontend",
      healthCheck: {
        interval: Duration.seconds(10),
        healthyThresholdCount: 2,
      },
    });

    // listener
    const httpListener = lb.addListener("FrontendHTTPListener", {
      protocol: ApplicationProtocol.HTTP,
      open: true,
      // route requests to frontend by default
      defaultTargetGroups: [frontendTg],
    });
    const httpsListener = lb.addListener("FrontendHTTPSListener", {
      protocol: ApplicationProtocol.HTTPS,
      open: true,
      // route requests to frontend by default
      defaultTargetGroups: [frontendTg],
      certificates: [
        {
          certificateArn:
            // must be in region of stack
            // TODO: config
            "arn:aws:acm:us-west-2:450542611688:certificate/68f4c06e-b71e-4c71-bd89-7ee5efc0233b",
        },
      ],
    });

    // TODO: limit to CF and internal services
    httpListener.connections.allowDefaultPortFromAnyIpv4("Open to the world");
    httpsListener.connections.allowDefaultPortFromAnyIpv4("Open to the world");
    const action = {
      // /api/* and /pictrs/* -> backend
      action: ListenerAction.forward([backendTg]),
      conditions: [ListenerCondition.pathPatterns(["/api/*", "/pictrs/*"])],
      priority: 1,
    };
    httpListener.addAction(`BackendHTTPAPIRouter`, action);
    httpsListener.addAction(`BackendHTTPSAPIRouter`, action);

    this.backendTargetGroup = backendTg;
    this.frontendTargetGroup = frontendTg;
    this.alb = lb;
  }
}
