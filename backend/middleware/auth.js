const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const bearerToken = req.headers.authorization?.split(' ')[1];
  const cookieToken = req.cookies?.auth_token;
  const token = cookieToken || bearerToken;
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const normalizedId = data.id || data._id;
    req.user = { ...data, id: normalizedId, _id: normalizedId };
    next();
  } catch {
    res.status(401).json({ message: 'Token invalido' });
  }
};
