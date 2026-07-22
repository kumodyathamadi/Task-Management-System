import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Token could be "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token provided.'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_31abcdf425890';
    const decoded = jwt.verify(token, secret);
    
    // Attach decoded user info to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Invalid or expired authentication token.'
    });
  }
}
