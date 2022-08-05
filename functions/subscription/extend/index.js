const { getConnection } = require("/opt/db");

exports.handler = async event => {
  const { id } = event;

  const connection = await getConnection();

  await connection.raw(
    `
    update user_subscription 
    set renewal_date = renewal_date + interval '30 days'
    where id = ?
    `,
    [id]
  );
};