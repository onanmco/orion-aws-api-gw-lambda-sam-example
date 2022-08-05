const { getConnection } = require("/opt/db");

exports.handler = async event => {
    const { id } = event;
    
    const connection = await getConnection();
    
    await connection.raw(`DELETE FROM transaction WHERE id = ?`, [ id ]);
};