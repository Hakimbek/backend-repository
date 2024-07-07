const { Stack, aws_lambda, aws_iam, aws_apigateway } = require('aws-cdk-lib');

class ImportServiceStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const lambdaRole = new aws_iam.Role(this, 'LambdaRole', {
      assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaRole.addManagedPolicy(
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSQSFullAccess')
    );
    lambdaRole.addManagedPolicy(
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
    );
    lambdaRole.addManagedPolicy(
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess')
    );

    const ENVIRONMENT_VARIABLES = {
      S3_BUCKET_NAME: 'my-import-service',
      REGION: 'eu-north-1'
    }

    const importProductsFile = new aws_lambda.Function(this, 'ImportProductsFileFunction', {
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      code: aws_lambda.Code.fromAsset('lambda'),
      handler: 'importProductsFile.handler',
      role: lambdaRole,
      environment: ENVIRONMENT_VARIABLES
    });

    new aws_lambda.Function(this, 'ImportFileParserFunction', {
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      code: aws_lambda.Code.fromAsset('lambda'),
      handler: 'importFileParser.handler',
      role: lambdaRole,
      environment: ENVIRONMENT_VARIABLES
    });

    const productsApi = new aws_apigateway.LambdaRestApi(this, 'ProductsApi', {
      handler: importProductsFile,
      proxy: false,
    });

    const importProductsFileResource = productsApi.root.addResource('import');
    importProductsFileResource.addMethod('GET');
  }
}

module.exports = { ImportServiceStack }
