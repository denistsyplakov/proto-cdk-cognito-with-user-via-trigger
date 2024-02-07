import {
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand,
    CognitoIdentityProviderClient
} from "@aws-sdk/client-cognito-identity-provider";
import * as genPw from "generate-password";
import {SecretsManagerClient, UpdateSecretCommand} from "@aws-sdk/client-secrets-manager";


export const handler = async (event: any = {}): Promise<any> => {
    console.log("Triggered event", JSON.stringify(event));
    try {
        const client = new CognitoIdentityProviderClient();
        const responseAdd = await client.send(new AdminCreateUserCommand({
            UserPoolId: process.env.USER_POOL_ID as string,
            Username: process.env.ADMIN_EMAIL,
            UserAttributes: [
                {
                    Name: "email",
                    Value: process.env.ADMIN_EMAIL,
                },
                {
                    Name: 'email_verified',
                    Value: 'true'
                }
            ]
        }));
        console.log("Add user response", JSON.stringify(responseAdd));
        const password = generatePassword();
        const responsePw = await client.send(new AdminSetUserPasswordCommand({ // AdminSetUserPasswordRequest
            UserPoolId: process.env.USER_POOL_ID as string,
            Username: process.env.ADMIN_EMAIL,
            Password: password,
            Permanent: true,
        }));
        console.log("Set password response", JSON.stringify(responsePw));
        const smClient = new SecretsManagerClient();
        const response = await smClient.send(
            new UpdateSecretCommand({
                SecretId: process.env.SECRET_NAME as string,
                SecretString: JSON.stringify({username: process.env.ADMIN_EMAIL, password}),
            }),
        );
        console.log("Update secret response", JSON.stringify(response));
    } catch (e) {
        console.error("Error", e);
    }
}

function generatePassword(): string {
    return genPw.generate({
        strict: true,
        excludeSimilarCharacters: true,
        length: 12,
        numbers: true,
        symbols: true,
        exclude: '"`\'',
    });
}
