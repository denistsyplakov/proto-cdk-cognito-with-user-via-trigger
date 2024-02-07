import * as cdk from 'aws-cdk-lib';
import {Duration, RemovalPolicy, triggers} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {UserPool, UserPoolClient} from "aws-cdk-lib/aws-cognito";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import * as path from "node:path";
import * as sm from 'aws-cdk-lib/aws-secretsmanager';


// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ProtoCdkCognitoWithUserStack extends cdk.Stack {

    private userPool: UserPool;
    private userPoolClient: UserPoolClient;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.userPool = new UserPool(this, 'UserPool', {
            userPoolName: 'Proto-CDK-trigger',
            selfSignUpEnabled: false,
            signInAliases: {
                email: true,
            },
            removalPolicy: RemovalPolicy.DESTROY,
        });
        this.userPoolClient = this.userPool.addClient('WebUIClient', {
            userPoolClientName: 'WebUIClient'
        });

        this.buildPostCognitoTrigger();
    }

    private buildPostCognitoTrigger() {
        const adminEmail = 'admin@trag.com';
        const templatedSecret = new sm.Secret(this, 'admin-creds', {
            secretName: 'admin-credentials',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({username: adminEmail}),
                generateStringKey: 'password'
            },
        });
        const fun: NodejsFunction = constructNodeLambda(this,
            'funCognitoAdminUser',
            'create-admin-user.ts',
            {
                ADMIN_EMAIL: adminEmail,
                USER_POOL_ID: this.userPool.userPoolId,
                SECRET_NAME: templatedSecret.secretName,
            }
        );
        this.userPool.grant(fun, 'cognito-idp:*');
        templatedSecret.grantWrite(fun);
        new triggers.Trigger(this, 'triggerCognitoAdminUser', {
            handler: fun,
            executeAfter: [this.userPool, this.userPoolClient],
            executeOnHandlerChange: false,
            invocationType: triggers.InvocationType.EVENT,
        });

    }

}

function constructNodeLambda(scope: Construct, id: string, entryPoint: string, env: {}): NodejsFunction {
    return new NodejsFunction(scope, id, {
        entry: path.join(__dirname, 'lambdas', entryPoint),
        bundling: {
            externalModules: [
                'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
            ],
        },
        timeout: Duration.minutes(10),
        depsLockFilePath: path.join(__dirname, 'lambdas', 'package-lock.json'),
        environment: env,
        runtime: Runtime.NODEJS_18_X,

    });
}
