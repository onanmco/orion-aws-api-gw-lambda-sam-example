const { getConnection } = require("/opt/db");

exports.handler = async event => {
    const { user_id, price } = event;
    
    const connection = await getConnection();
    
    const wallet = await connection.select("*")
        .from("wallet")
        .where({user_id})
        .first();
        
    await connection("wallet")
        .increment("balance", price)
        .where({ id: wallet.id });
};