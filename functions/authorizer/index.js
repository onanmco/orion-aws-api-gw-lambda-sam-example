const { verify } = require("jsonwebtoken");

exports.handler = (event, context, callback) => {
    try {
        const { authorizationToken, methodArn: resource } = event;

        try {
            verify(authorizationToken, process.env.SECRET_KEY);
        } catch (e) {
            return callback("Unauthorized");
        }
    
        callback(null, generatePolicy({ principalId: "user", effect: "Allow", resource }));
    } catch (e) {
        console.log(e);
        callback("Error: Invalid token");
    }
};

const generatePolicy = ({ principalId, effect, resource }) => ({
    principalId,
    policyDocument: {
        Version: "2012-10-17",
        Statement: [
            {
                Action: "execute-api:Invoke",
                Effect: effect,
                Resource: resource
            }
        ]
    }
});