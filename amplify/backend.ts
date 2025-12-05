import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { CfnOutput } from 'aws-cdk-lib';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
});

// --- Ab hier fügen wir Custom CDK (Python) hinzu ---

// 1. Wir erstellen einen neuen Stack für unsere Python-Sachen
const customStack = backend.createStack('PythonBackendStack');

// 2. Die Python Lambda definieren
const pythonLambda = new lambda.Function(customStack, 'PythonPasswordFn', {
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: 'lambda_function.lambda_handler',
  // Der Pfad muss relativ zur amplify/backend.ts Datei sein
  code: lambda.Code.fromAsset('amplify/functions/python-lambda'),
  memorySize: 128,
  //timeout: cdk.Duration.seconds(3) // Optional: CDK Duration importieren oder weglassen
});

// 3. Das HTTP API Gateway definieren
const httpApi = new apigw.HttpApi(customStack, 'PythonApi', {
  corsPreflight: {
    allowOrigins: ['*'],
    allowMethods: [apigw.CorsHttpMethod.POST],
    allowHeaders: ['*'],
  },
});

// 4. Lambda mit API verbinden
const integration = new integrations.HttpLambdaIntegration(
  'PythonIntegration', 
  pythonLambda
);

httpApi.addRoutes({
  path: '/generate',
  methods: [apigw.HttpMethod.POST],
  integration: integration,
});

// 5. Die URL ausgeben (damit wir sie im Frontend nutzen können)
// In Gen 2 finden wir Outputs in der amplify_outputs.json, aber für Cfn Outputs:
new CfnOutput(customStack, 'ApiUrl', {
  value: httpApi.url || '',
});