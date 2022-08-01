const { knex } = require("knex");
const { SecretsManager } = require("aws-sdk");

const database = "postgres";
const SecretId = process.env.DB_CONFIG_SECRET_ID;

const secretsManagerClient = new SecretsManager({ region: process.env.REGION });

const getConnection = async () => {
    const { SecretString } = await secretsManagerClient.getSecretValue({ SecretId }).promise();
    const { username: user, password, host, port } = JSON.parse(SecretString);
    return knex({
        client: "pg",
        connection: {
            user,
            password,
            host,
            port,
            database
        },
        pool: {
            min: 0,
            max: 1
        },
        acquireConnectionTimeout: 30000
    });
};

exports.getConnection = getConnection;