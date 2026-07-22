/**
 * Delete all student accounts (keeps admin/officer accounts).
 * Usage: node database/reset-students.js
 */

const mysql = require("mysql2/promise");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "geolocation_rotc_cwts_system";

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  const [result] = await conn.execute("DELETE FROM students WHERE role = 'student'");
  console.log(`Deleted ${result.affectedRows} student(s). Admin/officer accounts kept.`);
  await conn.end();
}

main().catch((err) => {
  console.error("Reset failed:", err.message);
  process.exit(1);
});
