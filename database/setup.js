/**
 * One-command database setup for BCC ROTC/CWTS Geolocation Attendance System.
 *
 * This script:
 *   1. Creates the database (if it doesn't exist)
 *   2. Creates all tables (if they don't exist)
 *   3. Seeds the admin/officer accounts
 *
 * Usage:
 *   1. Start XAMPP (Apache + MySQL)
 *   2. Run:  node database/setup.js
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "geolocation_rotc_cwts_system";

const ADMINS = [
  {
    email: "bcc.rotc.admin@gmail.com",
    username: "ROTC Admin",
    password: "rotc@admin",
    role: "admin",
    firstName: "ROTC",
    lastName: "Admin",
  },
  {
    email: "bcc.cwts.admin@gmail.com",
    username: "CWTS Admin",
    password: "acwts@admin",
    role: "admin",
    firstName: "CWTS",
    lastName: "Admin",
  },
  {
    email: "bcc.officer.admin@gmail.com",
    username: "NSTP Director",
    password: "officer@admin",
    role: "officer",
    firstName: "NSTP",
    lastName: "Director",
  },
];

async function main() {
  console.log("=== BCC ROTC/CWTS Database Setup ===\n");

  console.log("1) Connecting to MySQL...");
  const rootConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });
  console.log("   Connected!\n");

  console.log("2) Running schema.sql (creating database & tables)...");
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await rootConn.query(schemaSql);
  console.log("   Database and tables created!\n");

  await rootConn.end();

  console.log("3) Seeding admin/officer accounts...");
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  for (const admin of ADMINS) {
    try {
      await conn.execute(
        `INSERT INTO students (student_id, email, username, password, role, first_name, last_name, nstp_component)
         VALUES (?, ?, ?, ?, ?, ?, ?, '')
         ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)`,
        [admin.username, admin.email, admin.username, admin.password, admin.role, admin.firstName, admin.lastName]
      );
      console.log(`   OK: ${admin.email} (${admin.role})`);
    } catch (err) {
      console.error(`   FAIL: ${admin.email} =>`, err.message);
    }
  }

  await conn.end();

  console.log("\n=== Setup Complete! ===");
  console.log("\nYou can now run the app:");
  console.log("  npm run dev");
  console.log("\nAdmin logins:");
  for (const a of ADMINS) {
    console.log(`  ${a.role.padEnd(8)} | Email: ${a.email} | Password: ${a.password}`);
  }
  console.log("");
}

main().catch((err) => {
  console.error("\nSetup failed:", err.message);
  console.error("\nMake sure:");
  console.error("  1. XAMPP is running (Apache + MySQL)");
  console.error("  2. MySQL is on port 3306 with user 'root' and no password");
  process.exit(1);
});
