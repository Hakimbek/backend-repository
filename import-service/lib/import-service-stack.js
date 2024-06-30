const { Stack } = require('aws-cdk-lib');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const lambda = require('aws-cdk-lib/aws-lambda');
const iam = require('aws-cdk-lib/aws-iam');

class ImportServiceStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const lambdaARole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaARole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
    );
    lambdaARole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess')
    );

    const ENVIRONMENT_VARIABLES = {
      S3_BUCKET_NAME: 'my-import-service',
      REGION: 'eu-north-1'
    }

    const importProductsFile = new lambda.Function(this, 'ImportProductsFileFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'importProductsFile.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    });

    new lambda.Function(this, 'ImportFileParserFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'importFileParser.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    });

    const productsApi = new apigateway.LambdaRestApi(this, 'ProductsApi', {
      handler: importProductsFile,
      proxy: false,
    });

    const importProductsFileResource = productsApi.root.addResource('import');
    importProductsFileResource.addMethod('GET');
  }
}

module.exports = { ImportServiceStack }
