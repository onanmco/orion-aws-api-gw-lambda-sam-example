const { getConnection } = require("/opt/db");

exports.handler = async event => {
    const { id } = event;
    
    const connection = await getConnection();
    
    const user = await connection.select("*")
        .from("user")
        .where({ id })
        .first();
        
    return user;
};