/**
 * Run this once to insert admin/officer accounts into MySQL.
 * Usage: node database/seed-admins.js
 *
 * Edit the passwords below before running!
 */

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const DB_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "geolocation_rotc_cwts_system",
};

// ====== EDIT THESE PASSWORDS ======
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
// ==================================

async function main() {
  const conn = await mysql.createConnection(DB_CONFIG);

  for (const admin of ADMINS) {
    const hashed = await bcrypt.hash(admin.password, 10);

    try {
      await conn.execute(
        `INSERT INTO students (student_id, email, username, password, role, first_name, last_name, nstp_component)
         VALUES (?, ?, ?, ?, ?, ?, ?, '')
         ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)`,
        [admin.username, admin.email, admin.username, hashed, admin.role, admin.firstName, admin.lastName]
      );
      console.log(`OK: ${admin.email} (${admin.role})`);
    } catch (err) {
      console.error(`FAIL: ${admin.email} =>`, err.message);
    }
  }

  await conn.end();
  console.log("\nDone! You can now log in with the admin accounts.");
}

main();
