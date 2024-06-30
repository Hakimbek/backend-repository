const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

exports.handler = async (event) => {
    try {
        const fileName = event.queryStringParameters.name;
        console.log('Get name from queryStringParameters. name=' + fileName);

        const bucketName = process.env.S3_BUCKET_NAME;
        console.log('Get bucket name from env. bucketName=' + bucketName);

        const region = process.env.REGION;
        console.log('Get region from env. region=' + region);

        const key = `uploaded/${fileName}`;
        console.log('Generate key. key=' + key);

        const params = {
            Bucket: bucketName,
            Key: key
        }
        console.log('Generate params. params=' + params);

        const client = new S3Client({ region });
        console.log('Creat S3 client');

        const command = new PutObjectCommand(params);
        console.log('Creat PutObject command');

        const presignedUrl = await getSignedUrl(client, command);
        console.log('Create presignedUrl. presignedUrl=' + presignedUrl);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Content-Type": "application/json"
            },
            body: presignedUrl
        }
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