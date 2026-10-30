const isDev = process.env.NODE_ENV === "development";
export const DATABASE_URL = isDev ? process.env.DATABASE_LOCAL_URL : process.env.DATABASE_URL;
export const MSG91_API = "https://control.msg91.com/api/v5/";
export const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || "";
export const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || "";
export const JWT_SECRET = process.env.JWT_SECRET || "bytecode-super-secret-jwt-key-2026-msg91";
export const JWT_ACCESS_EXPIRATION = "15m";
export const JWT_REFRESH_EXPIRATION = "30d";
