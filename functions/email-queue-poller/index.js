var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.REGION });
const ses = new AWS.SES({ apiVersion: '2010-12-01' });
const sqs = new AWS.SQS();

exports.handler = async event => {
    console.log(JSON.stringify(event));

    const failures = 0;
    for (const { receiptHandle, body } of event.Records) {
        try {
            await ses.sendEmail(JSON.parse(body)).promise();
            await sqs.deleteMessage({
                QueueUrl: process.env.QUEUE_URL,
                ReceiptHandle: receiptHandle
            }).promise();
        } catch (e) {
            console.log(e);
            failures++;
        }
    }
    if (failures > 0) {
        throw new Error(`${failures}/${event.Records.length} of messages could not be processed. They will be re-processed after visibility timeout.`);
    }
};