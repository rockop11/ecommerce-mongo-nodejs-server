const jwt = require('jsonwebtoken');
const { envs } = require("../config/plugins")

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).send({ message: 'No token provided or incorrect format!' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, envs.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized!' });
        }
        
        next();
    });
};

module.exports = verifyToken;