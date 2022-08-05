const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.REGION
});
const s3 = new AWS.S3();
const ses = new AWS.SES();

exports.handler = async event => {
  console.log(JSON.stringify(event));
  
  const { replacements, email, bucket, key } = event;


  const { Body } = await s3.getObject({
    Bucket: bucket,
    Key: key
  }).promise();

  console.log(Body);

  let template = Body.toString("utf-8");

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
};