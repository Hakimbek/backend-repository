const { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const csv = require("csv-parser");

const client = new S3Client({});

exports.handler = async (event) => {
    try {
        const bucket = event.Records[0].s3.bucket.name;
        console.log('Get bucket name from event. bucket=' + bucket);

        const uploadedKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        console.log('Get key from event. key=' + uploadedKey);

        const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: uploadedKey,
        });
        console.log('Generate get command', getCommand);

        const response = await client.send(getCommand);
        console.log('Send command');

        const readableStream = response.Body;
        console.log('Get body of response');

        await new Promise((resolve, reject) => {
            readableStream
                .pipe(csv({
                    delimiter: ',',
                    columns: true,
                }))
                .on("data", (data) => {
                    console.log("Parsed product", data);
                })
                .on("error", (err) => {
                    console.error("Error", err);
                    reject(err);
                })
                .on("end", async () => {
                    console.log('End of parsing')

                    const parsedKey = 'parsed/' + uploadedKey.split('/')[1]
                    console.log('Get parsed key. parsedKey=' + parsedKey);

                    const copyCommand = new CopyObjectCommand({
                        Bucket: bucket,
                        CopySource: `/${bucket}/${uploadedKey}`,
                        Key: parsedKey,
                    });
                    console.log('Generate copy command.', copyCommand);

                    await client.send(copyCommand);
                    console.log('Copy object');

                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: bucket,
                        Key: uploadedKey,
                    });
                    console.log('Generate delete command', deleteCommand);

                    await client.send(deleteCommand);
                    console.log('Delete object');
                })
        })

    } catch (err) {
        console.error("Error", err);
    }
}