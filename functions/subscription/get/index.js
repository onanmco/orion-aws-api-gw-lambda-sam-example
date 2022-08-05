const { getConnection } = require("/opt/db");

exports.handler = async event => {
    const { id } = event;
    
    const connection = await getConnection();
    
    const subscription = await connection.select("*")
        .from("subscription")
        .where({ id })
        .first();
        
    return subscription;
};