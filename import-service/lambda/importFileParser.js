const { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { SendMessageCommand, SQSClient, GetQueueUrlCommand } = require("@aws-sdk/client-sqs");
const csv = require('csv-parser');

exports.handler = async (event) => {
    try {
        const bucket = event.Records[0].s3.bucket.name;
        const uploadedKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        console.log(`Get bucket name and key from event\nkey=${uploadedKey}\nbucket=${bucket}`);

        const s3Client = new S3Client({});
        const s3GetCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: uploadedKey,
        });
        const response = await s3Client.send(s3GetCommand);
        const readableStream = response.Body;
        console.log('Get object from bucket using bucket name and key');

        const sqsClient = new SQSClient({});
        const getQueueUrlCommand = new GetQueueUrlCommand({ QueueName: 'catalogItemsQueue' });
        const catalogItemsQueueUrlObject = await sqsClient.send(getQueueUrlCommand);
        const catalogItemsQueueUrl = catalogItemsQueueUrlObject.QueueUrl;
        console.log(`Get SQS URL\nurl=${catalogItemsQueueUrl}`);

        await new Promise((resolve, reject) => {
            readableStream
                .pipe(csv({
                    delimiter: ',',
                    columns: true,
                }))
                .on('data', async (data) => {
                    console.log('Data', data);
                    const sqsSendMessageCommand = new SendMessageCommand({
                        QueueUrl: catalogItemsQueueUrl,
                        MessageBody: JSON.stringify(data)
                    });

                    await sqsClient.send(sqsSendMessageCommand);
                    console.log('Send SQS message');
                })
                .on('error', (error) => {
                    reject(error);
                })
                .on('end', async () => {
                    console.log('End of parsing')

                    const parsedKey = 'parsed/' + uploadedKey.split('/')[1]
                    console.log(`Get parsed key. parsedKey=${parsedKey}`);

                    const s3CopyCommand = new CopyObjectCommand({
                        Bucket: bucket,
                        CopySource: `/${bucket}/${uploadedKey}`,
                        Key: parsedKey,
                    });
                    await s3Client.send(s3CopyCommand);
                    console.log('Copy object from uploaded bucket to parsed bucket');

                    const s3DeleteCommand = new DeleteObjectCommand({
                        Bucket: bucket,
                        Key: uploadedKey,
                    });
                    await s3Client.send(s3DeleteCommand);
                    console.log('Delete object from uploaded bucket');
                })
        })
    } catch (error) {
        console.error("Error", error);
    }
}