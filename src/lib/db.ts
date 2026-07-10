import mysql from "mysql2/promise";
import type { Pool, PoolOptions, RowDataPacket, ResultSetHeader } from "mysql2/promise";

const poolConfig: PoolOptions = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "geolocation_rotc_cwts_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(poolConfig);
  }
  return pool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryParam = any;

export async function query<T extends RowDataPacket[]>(
  sql: string,
  params?: QueryParam[]
): Promise<T> {
  const [rows] = await getPool().execute<T>(sql, params);
  return rows;
}

export async function execute(
  sql: string,
  params?: QueryParam[]
): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}

export async function getConnection() {
  return getPool().getConnection();
}

export { getPool };
export type { RowDataPacket, ResultSetHeader };
