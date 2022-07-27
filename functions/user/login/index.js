const { getConnection } = require("/opt/db");
const yup = require("yup");
const { sign } = require("jsonwebtoken");
const { compareSync } = require("bcryptjs");

const schema = yup.object({
    email: yup.string()
        .email()
        .required(),
    password: yup.string()
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

        const { email, password } = payload;

        const connection = await getConnection();

        const existingUser = await connection.select("*")
            .from("user")
            .where({ email })
            .first();

        if (!existingUser) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: "Not Found",
                    details: [
                        `User with email ${email} not found.`
                    ]
                })
            };
        }

        const { password: hash } = existingUser;

        if (!compareSync(password, hash)) {
            return {
                statusCode: 401,
                body: JSON.stringify({
                    message: "Unauthorized",
                    details: [
                        "Wrong credentials."
                    ]
                })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                data: {
                    token: sign({ user_id: existingUser.id }, process.env.SECRET_KEY)
                }
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