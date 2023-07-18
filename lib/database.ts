import { Construct } from "constructs";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as core from "aws-cdk-lib";
import { siteConfig } from "./config";

export const DB_NAME = "lemmy";

interface ILemmyAppProps {
  vpc: Vpc;
}

export class Database extends Construct {
  cluster: rds.ServerlessCluster;
  securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, { vpc }: ILemmyAppProps) {
    super(scope, id);

    this.securityGroup = new SecurityGroup(this, "DBSecurityGroup", {
      vpc,
      description: "Database ingress",
    });

    this.cluster = new rds.ServerlessCluster(this, "LemmyCluster", {
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        "ParameterGroup",
        "lemmy-db-parameter-group"
      ),
      defaultDatabaseName: DB_NAME,
      vpc,
      securityGroups: [this.securityGroup],
      clusterIdentifier: "lemmy",
      removalPolicy: core.RemovalPolicy.DESTROY,
      scaling: {
        minCapacity: 2,
        maxCapacity: siteConfig.dbMaxCapacity,
        autoPause: core.Duration.hours(siteConfig.dbSleepHours),
      },
    });
  }
}
