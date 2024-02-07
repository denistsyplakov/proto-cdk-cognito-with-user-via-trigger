#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProtoCdkCognitoWithUserStack } from '../lib/proto-cdk-cognito-with-user-stack';
import {Tags} from "aws-cdk-lib";

const app = new cdk.App();
new ProtoCdkCognitoWithUserStack(app, 'ProtoCdkCognitoWithUserStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});

Tags.of(app).add("Owner", "Denis Tsyplakov");
