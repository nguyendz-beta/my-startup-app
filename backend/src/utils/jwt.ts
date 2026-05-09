import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
export const signAccess = (payload: any) => jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
export const signRefresh = (payload: any) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
export const verify = (token: string) => jwt.verify(token, JWT_SECRET);
