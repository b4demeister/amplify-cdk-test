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


const myLayer = new lambda.LayerVersion(customStack, 'MyTestLayer', {
  code: lambda.Code.fromAsset('amplify/functions/layers/test-layer'),
  compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
  description: 'Ein Test-Layer mit testlib.py',
});

// 2. Die Python Lambda definieren
const pythonLambda = new lambda.Function(customStack, 'PythonPasswordFn', {
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: 'lambda_function.lambda_handler',
  code: lambda.Code.fromAsset('amplify/functions/python-lambda'),
  memorySize: 128,
  // HIER KOMMT DER LAYER DAZU:
  layers: [myLayer] 
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

httpApi.addRoutes({
  path: '/xx',
  methods: [apigw.HttpMethod.GET, apigw.HttpMethod.POST], // Auch GET erlauben
  integration: integration,
});

// 5. Die URL ausgeben (damit wir sie im Frontend nutzen können)
// In Gen 2 finden wir Outputs in der amplify_outputs.json, aber für Cfn Outputs:
new CfnOutput(customStack, 'ApiUrl', {
  value: httpApi.url || '',
});