const { getConnection } = require("/opt/db");
const yup = require("yup");

const schema = yup.object({
    title: yup.string()
        .min(3)
        .max(255)
        .required(),
    body: yup.string()
        .required(),
    user_id: yup.number()
        .required()
});

exports.handler = async event => {
    console.log(JSON.stringify(event));

    try {
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

        const { title, body, user_id } = payload;

        const connection = await getConnection();

        const existingUser = await connection.select("*")
            .from("user")
            .where({ id: user_id })
            .first();

        if (!existingUser) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Bad Request",
                    details: [
                        "User not found."
                    ]
                })
            };
        }

        const now = new Date();

        const [ savedPost ] = await connection.insert({
                title,
                body,
                user_id,
                created_at: now,
                updated_at: now
            })
            .into("post")
            .returning("*");
        
        return {
            statusCode: 201,
            body: JSON.stringify({
                data: savedPost
            })
        };
    } catch (e) {
        console.log(e);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Internal Server Error"
            })
        };
    }
};