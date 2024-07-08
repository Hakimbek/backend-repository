const AWS = require('aws-sdk');
const { PublishCommand, SNSClient } = require('@aws-sdk/client-sns');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        for (const record of event.Records) {
            let data = JSON.parse(record.body);
            const id = AWS.util.uuid.v4();
            const title = String(data.name);
            const description = String(data.description);
            const price = Number(data.price);
            const count = Number(data.count);
            console.log('Data', data);

            if (!title || !description || !price || !count) {
               throw new Error('Wrong prop type');
            }

            await docClient.transactWrite({
                TransactItems: [
                    {
                        Put: {
                            TableName: process.env.PRODUCTS_TABLE,
                            Item: { id, title, description, price }
                        }
                    },
                    {
                        Put: {
                            TableName: process.env.STOCKS_TABLE,
                            Item: { 'product_id': id, count }
                        }
                    }
                ]
            }).promise();
            console.log('Add product');

            const message = `Product has been created:\ntitle: ${title}\nprice: ${price}\ndescription: ${description}\ncount: ${count}`;
            const snsClient = new SNSClient({});
            const snsPublishCommand = new PublishCommand({
                TopicArn: process.env.SNS_TOPIC_ARN,
                Message: message
            })
            await snsClient.send(snsPublishCommand);
            console.log('Send message', message);
        }

        console.log('Successfully added');
    } catch (error) {
        console.log(error);
    }
}