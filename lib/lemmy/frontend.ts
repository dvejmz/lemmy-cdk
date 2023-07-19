import { Construct } from "constructs";
import * as path from 'path';
import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
import {
  ContainerImage,
  LogDriver,
  Protocol,
  TaskDefinition,
} from "aws-cdk-lib/aws-ecs";
import * as core from "aws-cdk-lib";
import { siteConfig } from "../config";
import { BACKEND_NAME, BACKEND_PORT } from "./backend";

interface ILemmyFrontendProps {
  taskDef: TaskDefinition;
}

export const FRONTEND_PORT = 1234;
export const FRONTEND_NAME = "lemmy-ui";

export class LemmyFrontend extends Construct {
  backendContainer: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    { taskDef }: ILemmyFrontendProps
  ) {
    super(scope, id);

    const frontendContainer = taskDef.addContainer(FRONTEND_NAME, {
      essential: true,
      image: ContainerImage.fromRegistry('dessalines/lemmy-ui:0.9.9'),
      environment: {
        LEMMY_INTERNAL_HOST: `localhost:${BACKEND_PORT}`,
        LEMMY_EXTERNAL_HOST: siteConfig.siteDomainName,
        LEMMY_WS_HOST: `api.${siteConfig.siteDomainName}`,
        LEMMY_HTTPS: "true",
      },
      logging: LogDriver.awsLogs({ streamPrefix: "frontend" }),
    });
    // map port
    frontendContainer.addPortMappings({
      containerPort: FRONTEND_PORT,
      protocol: Protocol.TCP,
    });
  }
}
