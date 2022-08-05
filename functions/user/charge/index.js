const { getConnection } = require("/opt/db");

exports.handler = async event => {
  const { price, user_id } = event;

  const connection = await getConnection();

  const {
    rows: [
      {
        is_balance_sufficient: isBalanceSufficient
      }
    ]
  } = await connection.raw(
    `
    select
    	case
    		when balance < ?::decimal(13, 4) then false
    		else true
    	end as is_balance_sufficient
    from
    	wallet
    where
    	user_id = ?
    `,
    [price, user_id]
  );

  if (!isBalanceSufficient) {
    throw new Error("Insufficient balance.");
  }

  await connection("wallet")
    .decrement("balance", price)
    .where({
      user_id
    });
};