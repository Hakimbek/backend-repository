const AWS = require('aws-sdk');
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
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: 'Successfully added!' }),
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
}