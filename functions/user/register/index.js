const { getConnection } = require("/opt/db");
const yup = require("yup");
const { sign } = require("jsonwebtoken");
const { hashSync } = require("bcryptjs");

const schema = yup.object({
    first_name: yup.string()
        .required(),
    last_name: yup.string()
        .required(),
    email: yup.string()
        .required(),
    password: yup.string()
        .min(8)
        .max(16)
        .matches(/[A-Z]/, "password field must contain at least one uppercase letter.")
        .matches(/\d/, "password field must contain at least one digit.")
        .required()
});

exports.handler = async event => {
    console.log(JSON.stringify(event));

    try {
        const payload = JSON.parse(event.body);

        try {
            schema.validateSync(payload, { abortEarly: false })
        } catch ({ errors: details }) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Bad Request",
                    details
                })
            };
        }
    
        const { first_name, last_name, email, password } = payload;
    
        const connection = await getConnection();
    
        const existingUser = await connection.select("*")
            .from("user")
            .where({ email })
            .first();
    
        if (existingUser) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Bad Request",
                    details: [
                        `${email} has already taken.`
                    ]
                })
            };
        }
    
        const [ savedUser ] = await connection.insert({
            first_name,
            last_name,
            email,
            password: hashSync(password, 10),
            created_at: new Date()
        })
        .into("user")
        .returning("*");
    
        const token = sign({
            user_id: savedUser.id
        }, process.env.SECRET_KEY);
    
        return {
            statusCode: 201,
            body: JSON.stringify({
                data: {
                    user: savedUser,
                    token
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