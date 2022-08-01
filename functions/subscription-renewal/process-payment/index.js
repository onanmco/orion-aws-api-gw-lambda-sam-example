const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION
});
const sqs = new AWS.SQS();
const sns = new AWS.SNS();
const { getConnection } = require("/opt/db");

class ClientSideError extends Error {
  constructor(message) {
    super(message);
  }
}

exports.handler = async event => {
  console.log(JSON.stringify(event));
  const connection = await getConnection();
  let failures = 0;
  
  for (const { receiptHandle, body } of event.Records) {
    try {
      const { user_subscription_id, subscription_name, user_id, price, first_name, last_name, email } = JSON.parse(body);

      const { rows: [{ is_balance_sufficient: isBalanceSufficient }] } = await connection.raw(
        `
        select
          case
              when w.balance < ?::decimal(13, 4) then false
              else true
          end as is_balance_sufficient
        from wallet w
        where w.user_id = ? 
        `,
        [price, user_id]
      );

      if (!isBalanceSufficient) {
        connection("user_subscription")
          .update({ is_active: false })
          .where({ id: user_subscription_id });
        throw new ClientSideError("Insufficient balance.");
      }

      await connection("wallet")
        .decrement("balance", price)
        .where({ user_id });

      await sns.publish({
        TopicArn: process.env.TRANSACTIONS_TOPIC_ARN,
        Message: JSON.stringify({
          user_subscription_id,
          price,
          subscription_name,
          first_name,
          last_name,
          email
        }),
      }).promise();

      await sqs.deleteMessage({
        QueueUrl: process.env.SUBSCRIPTION_RENEWAL_QUEUE_URL,
        ReceiptHandle: receiptHandle
      }).promise();
    } catch (e) {
      console.log(e);
      if (e instanceof ClientSideError) {
        await sqs.deleteMessage({
          QueueUrl: process.env.SUBSCRIPTION_RENEWAL_QUEUE_URL,
          ReceiptHandle: receiptHandle
        }).promise();
      } else {
        failures++;
      }
    }
  }

  if (failures > 0) {
    throw new Error(`${failures}/${event.Records.length} of messages could not be processed. They will be returned to the queue after visibility timeout.`);
  }
};