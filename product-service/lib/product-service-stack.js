const {
  Stack,
  aws_lambda,
  aws_apigateway,
  aws_iam,
  aws_sqs,
  aws_lambda_event_sources,
  aws_sns,
  aws_sns_subscriptions
} = require('aws-cdk-lib');

class ProductServiceStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const lambdaARole = new aws_iam.Role(this, 'LambdaRole', {
      assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaARole.addManagedPolicy(
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );
    lambdaARole.addManagedPolicy(
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSQSFullAccess')
    );
    lambdaARole.addManagedPolicy(
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess')
    );
    lambdaARole.addManagedPolicy(
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSNSFullAccess')
    );

    const topic = new aws_sns.Topic(this, 'createProductTopic');
    topic.addSubscription(new aws_sns_subscriptions.EmailSubscription('khakimbakhramov@gmail.com'))

    const ENVIRONMENT_VARIABLES = {
      PRODUCTS_TABLE: 'products',
      STOCKS_TABLE: 'stocks',
      SNS_TOPIC_ARN: topic.topicArn
    }

    const getProductsList = new aws_lambda.Function(this, 'GetProductsListFunction', {
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      code: aws_lambda.Code.fromAsset('lambda'),
      handler: 'getProductsList.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    });

    const getProductById = new aws_lambda.Function(this, 'GetProductByIdFunction', {
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      code: aws_lambda.Code.fromAsset('lambda'),
      handler: 'getProductById.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    });

    const createProduct = new aws_lambda.Function(this, 'CreateProductFunction', {
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      code: aws_lambda.Code.fromAsset('lambda'),
      handler: 'createProduct.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    })

    const deleteProduct = new aws_lambda.Function(this, 'DeleteProductFunction', {
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      code: aws_lambda.Code.fromAsset('lambda'),
      handler: 'deleteProduct.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    })

    const options = new aws_lambda.Function(this, 'Options', {
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      code: aws_lambda.Code.fromAsset('lambda'),
      handler: 'options.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    })

    const catalogBatchProcess = new aws_lambda.Function(this, 'CatalogBatchProcess', {
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      code: aws_lambda.Code.fromAsset('lambda'),
      handler: 'catalogBatchProcess.handler',
      role: lambdaARole,
      environment: ENVIRONMENT_VARIABLES
    })

    const productsApi = new aws_apigateway.LambdaRestApi(this, 'ProductsApi', {
      handler: getProductsList,
      proxy: false,
    });

    const getProductsListResource = productsApi.root.addResource('products');
    getProductsListResource.addMethod('GET');
    getProductsListResource.addMethod('POST', new aws_apigateway.LambdaIntegration(createProduct))
    getProductsListResource.addMethod('OPTIONS', new aws_apigateway.LambdaIntegration(options))

    const getProductByIdResource = getProductsListResource.addResource('{id}');
    getProductByIdResource.addMethod('GET', new aws_apigateway.LambdaIntegration(getProductById))
    getProductByIdResource.addMethod('DELETE', new aws_apigateway.LambdaIntegration(deleteProduct))
    getProductByIdResource.addMethod('OPTIONS', new aws_apigateway.LambdaIntegration(options))

    const queue = new aws_sqs.Queue(this, 'SqsQueue', {
      queueName: 'catalogItemsQueue',
    })
    const sqsEventSource = new aws_lambda_event_sources.SqsEventSource(queue, {
      batchSize: 5
    });
    catalogBatchProcess.addEventSource(sqsEventSource);
  }
}

module.exports = { ProductServiceStack }
