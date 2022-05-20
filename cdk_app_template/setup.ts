const cdk = require('@aws-cdk/core');
const rds = require('@aws-cdk/aws-rds');
const secretsManager = require('@aws-cdk/aws-secretsmanager');
const ssm = require('@aws-cdk/aws-ssm');

class DBStack extends cdk.Stack {
    constructor(app, id, { serviceName = 'movies', stage, accountId, }) {
        super(app, id);

        const databaseUsername = 'movies-database';

        const databaseCredentialsSecret = new secretsManager.Secret(this, 'DBCredentialsSecret', {
            secretName: `${serviceName}-${stage}-credentials`,
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    username: databaseUsername,
                }),
                excludePunctuation: true,
                includeSpace: false,
                generateStringKey: 'password'
            }
        });

        new ssm.StringParameter(this, 'DBCredentialsArn', {
            parameterName: `${serviceName}-${stage}-credentials-arn`,
            stringValue: databaseCredentialsSecret.secretArn,
        });

        const isDev = stage !== "production";
        const dbConfig = {
            dbClusterIdentifier: `main-${serviceName}-${stage}-cluster`,
            engineMode: 'serverless',
            engine: 'aurora-postgresql',
            engineVersion: '10.7',
            enableHttpEndpoint: true,
            databaseName: 'main',
            masterUsername: databaseCredentialsSecret.secretValueFromJson('username').toString(),
            masterUserPassword: databaseCredentialsSecret.secretValueFromJson('password'),
            backupRetentionPeriod: isDev ? 1 : 30,
            finalSnapshotIdentifier: `main-${serviceName}-${stage}-snapshot`,
            scalingConfiguration: {
                autoPause: true,
                maxCapacity: isDev ? 4 : 384,
                minCapacity: 2,
                secondsUntilAutoPause: isDev ? 3600 : 10800,
            }
        };

        const rdsCluster = new rds.CfnDBCluster(this, 'DBCluster', { dbConfig,
            deletionProtection: isDev ? false : true,
        });

        const dbClusterArn = `arn:aws:rds:${this.region}:${this.account}:cluster:${rdsCluster.ref}`;

        new ssm.StringParameter(this, 'DBResourceArn', {
            parameterName: `${serviceName}-${stage}-resource-arn`,
            stringValue: dbClusterArn,
        });
    }
}

module.exports = { DBStack };