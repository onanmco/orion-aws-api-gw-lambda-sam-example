const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION
});
const sqs = new AWS.SQS();
const { getConnection } = require("/opt/db");

exports.handler = async () => {
  const connection = await getConnection();

    const { rows: subscriptions } = await connection.raw(
      `
      select
        us.id as user_subscription_id,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        s."name" as subscription_name,
        s.price
      from user_subscription us
      join "user" u on u.id = us.user_id
      join "subscription" s on s.id = us.subscription_id
      `
    );

  await Promise.all(subscriptions.map(subscription => {
    return sqs.sendMessage({
      QueueUrl: process.env.SUBSCRIPTION_RENEWAL_QUEUE_URL,
      MessageBody: JSON.stringify(subscription)
    })
      .promise();
  }));
};