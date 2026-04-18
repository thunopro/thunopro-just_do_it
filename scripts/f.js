import dotenv from "dotenv";
dotenv.config();

const SUPABASE_KEY = process.env.SUPABASE_ROLE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
console.log(SUPABASE_KEY, SUPABASE_URL);