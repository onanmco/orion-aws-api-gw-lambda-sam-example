const { getConnection } = require("/opt/db");

exports.handler = async event => {
    const { user_subscription_id, price } = event;
    
    const connection = await getConnection();
    
    const [ savedTransaction ] = await connection("transaction")
        .insert({
            user_subscription_id,
            price,
            created_at: new Date()
        })
        .returning("*");
    
    return savedTransaction;
};