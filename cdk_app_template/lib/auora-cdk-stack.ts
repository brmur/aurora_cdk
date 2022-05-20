import * as cdk from '@aws-cdk/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

export class AuroraSlsStack extends cdk.Stack {
    constructor (scope: cdk.Construct, id: string, props?: cdk.StackProps){
        super(scope, id, props);

        enum ServerlessInstanceType {
            SERVERLESS = 'serverless',
        }
        type CustomInstanceType = ServerlessInstanceType | ec2.InstanceType;
        const CustomInstanceType = { ...ServerlessInstanceType, ...ec2.InstanceType };

        new rds.DatabaseCluster(this, 'cluster-name', {
            clusterIdentifier: 'cluster-name',
            engine: rds.DatabaseClusterEngine.auroraMysql({
                version: rds.AuroraMysqlEngineVersion.of('8.0.mysql_aurora.3.02.0'), // The new minor version of Database Engine.
            }),
            credentials: rds.Credentials.fromGeneratedSecret('admin'),
            instanceProps: {
                instanceType:
                    CustomInstanceType.SERVERLESS as unknown as ec2.InstanceType
            },
            instances: 1,
        });
}
}
