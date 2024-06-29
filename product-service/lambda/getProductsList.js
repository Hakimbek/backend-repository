const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async () => {
    try {
        const products = await docClient.scan({
            TableName : process.env.PRODUCTS_TABLE
        }).promise();

        console.log('PRODUCTS_TABLE=' + JSON.stringify(process.env.PRODUCTS_TABLE));
        console.log('Get all products:\n' + JSON.stringify(products));

        const stocks = await docClient.scan({
            TableName : process.env.STOCKS_TABLE
        }).promise();

        console.log('STOCKS_TABLE=' + JSON.stringify(process.env.STOCKS_TABLE));
        console.log('Get all stocks:\n' + JSON.stringify(stocks));

        const joinedProductsAndStocks = products['Items'].map(product => {
            const stock = stocks['Items'].find(stock => stock['product_id'] === product['id']);

            return {
                ...product,
                count: stock ? stock.count : 0
            }
        })

        console.log('Join products and stocks:\n' + JSON.stringify(joinedProductsAndStocks));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ products: joinedProductsAndStocks }),
        };
    } catch {
        return {
            statusCode: 500,
            header: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: 'Something goes wrong!' })
        }
    }
};