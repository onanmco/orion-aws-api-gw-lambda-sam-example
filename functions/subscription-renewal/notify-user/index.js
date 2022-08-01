const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION
});
const sqs = new AWS.SQS();
const s3 = new AWS.S3();
const ses = new AWS.SES();

exports.handler = async event => {
  console.log(JSON.stringify(event));

  let failures = 0;

  for (const { receiptHandle, body } of event.Records) {
    try {
      const {
        first_name,
        last_name,
        email,
        subscription_name,
        price
      } = JSON.parse(body);

      const { Body } = await s3.getObject({
        Bucket: process.env.EMAIL_TEMPLATES_BUCKET_NAME,
        Key: process.env.PAYMENT_SUCCESSFUL_EMAIL_TEMPLATE_KEY
      })
        .promise();

      let template = Body.toString("utf-8");

      const replacements = [
        {
          placeholder: "###FIRST_NAME###",
          replacement: first_name
        },
        {
          placeholder: "###LAST_NAME###",
          replacement: last_name
        },
        {
          placeholder: "###SUBSCRIPTION_NAME###",
          replacement: subscription_name
        },
        {
          placeholder: "###PRICE###",
          replacement: price
        }
      ];

      for (const { placeholder, replacement } of replacements) {
        template = template.replace(new RegExp(placeholder, "mig"), replacement);
      }

      await ses.sendEmail({
        Destination: {
          ToAddresses: [email]
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: template
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: "Payment Successful"
          }
        },
        Source: process.env.FROM_EMAIL
      }).promise();

      await sqs.deleteMessage({
        QueueUrl: process.env.PAYMENT_NOTIFICATIONS_QUEUE_URL,
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