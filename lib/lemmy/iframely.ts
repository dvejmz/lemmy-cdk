import {
  ContainerDefinition,
  ContainerImage,
  LogDriver,
  Protocol,
  TaskDefinition,
} from "aws-cdk-lib/aws-ecs";
import * as core from "aws-cdk-lib";

interface IIFramelyProps {
  taskDef: TaskDefinition;
}

export const IFRAMELY_PORT = 8061;
export const IFRAMELY_IMAGE = "dogbin/iframely:latest";
export const IFRAMELY_NAME = "iframely";

export class IFramely extends Construct {
  container: ContainerDefinition;

  constructor(scope: Construct, id: string, { taskDef }: IIFramelyProps) {
    super(scope, id);

    const container = taskDef.addContainer(IFRAMELY_NAME, {
      image: ContainerImage.fromRegistry(IFRAMELY_IMAGE),
      logging: LogDriver.awsLogs({ streamPrefix: IFRAMELY_NAME }),
    });
    // map port
    container.addPortMappings({
      containerPort: IFRAMELY_PORT,
      protocol: Protocol.TCP,
    });
    this.container = container;
  }
}
