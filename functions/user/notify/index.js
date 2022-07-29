const yup = require("yup");
const AWS = require("aws-sdk");
const { getConnection } = require("/opt/db");
AWS.config.update({
    region: process.env.REGION
});
const s3 = new AWS.S3();
const sqs = new AWS.SQS();

const schema = yup.object({
    template: yup.string().required(),
    replacements: yup.array().of(
        yup.object()
            .shape({
                placeholder: yup.string().required(),
                replacementKey: yup.string()
            })
    ),
    subject: yup.string().required()
});

exports.handler = async event => {
    console.log(JSON.stringify(event));

    const payload = JSON.parse(event.body);

    try {
        schema.validateSync(payload, { abortEarly: false });
    } catch ({ errors: details }) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Bad Request",
                details
            })
        };
    }

    const { template, replacements, subject } = payload;

    const rawTemplate = await s3.getObject({ Bucket: process.env.BUCKET, Key: template }).promise();

    const connection = await getConnection();

    const subscribers = await connection.select("*")
        .from("user");

    await Promise.all(subscribers.map((subscriber) => {
        let htmlTemplate = rawTemplate.Body.toString("utf-8");
        for (const { placeholder, replacementKey } of replacements) {
            htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, "mig"), subscriber[replacementKey]);
        }
        return sqs.sendMessage(
            {
                QueueUrl: process.env.QUEUE_URL,
                MessageBody: JSON.stringify(
                    {
                        Destination: {
                            ToAddresses: [
                                subscriber.email
                            ]
                        },
                        Message: {
                            Body: {
                                Html: {
                                    Charset: "UTF-8",
                                    Data: htmlTemplate
                                },
                            },
                            Subject: {
                                Charset: 'UTF-8',
                                Data: subject
                            }
                        },
                        Source: process.env.FROM
                    }
                )
            }
        ).promise();
    }));

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "E-mails have been sent to the subscribers."
        })
    };
};