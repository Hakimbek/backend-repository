const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        let data = JSON.parse(event.body);
        const id = AWS.util.uuid.v4();
        const title = String(data.title);
        const description = String(data.description);
        const price = Number(data.price);
        const count = Number(data.count);
        console.log('Data', data);

        if (!title || !description || !price || !count) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: 'Invalid data!' }),
            };
        }

        const result = await docClient.transactWrite({
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

        console.log('Result:\n' + JSON.stringify(result));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(result),
        };
    } catch {
        return {
            statusCode: 500,
            header: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: 'Something goes wrong!' })
        }
    }
};
