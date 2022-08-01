const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION
});
const sqs = new AWS.SQS();
const { getConnection } = require("/opt/db");

exports.handler = async event => {
  console.log(JSON.stringify(event));
  const connection = await getConnection();
  let failures = 0;

  for (const { receiptHandle, body } of event.Records) {
    try {
      const {
        user_subscription_id,
        price
      } = JSON.parse(body);

      await connection.insert({
        user_subscription_id,
        price,
        created_at: new Date()
      })
        .into("transaction");

      await sqs.deleteMessage({
        QueueUrl: process.env.TRANSACTIONS_QUEUE_URL,
        ReceiptHandle: receiptHandle
      }).promise();
    } catch (e) {
      console.log(e);
      failures++;
    }
  }

  if (failures > 0) {
    throw new Error(`${failures}/${event.Records.length} of messages could not be processed. They will be returned to the queue after visibility timeout.`);
  }
};