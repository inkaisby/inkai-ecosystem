import * as dotenv from 'dotenv';
dotenv.config();
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20));
