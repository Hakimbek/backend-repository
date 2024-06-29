const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const id = event.path.split('/')[2];

        console.log('id=' + id);

        await docClient.delete({
            TableName : process.env.PRODUCTS_TABLE,
            Key: { id }
        }).promise();

        console.log('PRODUCTS_TABLE=' + JSON.stringify(process.env.PRODUCTS_TABLE));

        await docClient.delete({
            TableName : process.env.STOCKS_TABLE,
            Key: { 'product_id': id }
        }).promise();

        console.log('STOCKS_TABLE=' + JSON.stringify(process.env.STOCKS_TABLE));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: 'Successfully deleted!' }),
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
            body: JSON.stringify({ message: 'Product not found!' })
        }
    }
}