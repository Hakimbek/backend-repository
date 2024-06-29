const { Stack } = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const iam = require('aws-cdk-lib/aws-iam');

class ProductServiceStack extends Stack {
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
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );

    const ENVIRONMENT_VARIABLES = {
      PRODUCTS_TABLE: 'products',
      STOCKS_TABLE: 'stocks'
    }

    const getProductsList = new lambda.Function(this, 'GetProductsListFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'getProductsList.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    });

    const getProductById = new lambda.Function(this, 'GetProductByIdFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'getProductById.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    });

    const createProduct = new lambda.Function(this, 'CreateProductFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'createProduct.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    })

    const deleteProduct = new lambda.Function(this, 'DeleteProductFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'deleteProduct.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    })

    const options = new lambda.Function(this, 'Options', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'options.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    })

    const productsApi = new apigateway.LambdaRestApi(this, 'ProductsApi', {
      handler: getProductsList,
      proxy: false,
    });

    const getProductsListResource = productsApi.root.addResource('products');
    getProductsListResource.addMethod('GET');
    getProductsListResource.addMethod('POST', new apigateway.LambdaIntegration(createProduct))
    getProductsListResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(options))

    const getProductByIdResource = getProductsListResource.addResource('{id}');
    getProductByIdResource.addMethod('GET', new apigateway.LambdaIntegration(getProductById))
    getProductByIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteProduct))
    getProductByIdResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(options))
  }
}

module.exports = { ProductServiceStack }
