const { getConnection } = require("/opt/db");

exports.handler = async event => {
    const connection = await getConnection();
    
    const { user_id } = event;
    
    const subscription = await connection.select("*")
        .from("user_subscription")
        .where({ user_id })
        .first();
        
    return subscription;
};