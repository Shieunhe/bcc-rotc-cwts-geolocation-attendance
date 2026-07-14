const mysql = require("mysql2/promise");

async function main() {
  const c = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "geolocation_rotc_cwts_system",
  });

  const cols = [
    "academic_year VARCHAR(50) DEFAULT NULL",
    "ceremony_date VARCHAR(50) DEFAULT NULL",
    "commandant VARCHAR(255) DEFAULT NULL",
    "school_registrar VARCHAR(255) DEFAULT NULL",
    "nstp_coordinator VARCHAR(255) DEFAULT NULL",
    "municipal_mayor VARCHAR(255) DEFAULT NULL",
    "bcc_president VARCHAR(255) DEFAULT NULL",
    "commandant_signature LONGTEXT DEFAULT NULL",
    "school_registrar_signature LONGTEXT DEFAULT NULL",
    "nstp_coordinator_signature LONGTEXT DEFAULT NULL",
    "municipal_mayor_signature LONGTEXT DEFAULT NULL",
    "bcc_president_signature LONGTEXT DEFAULT NULL",
  ];

  for (const col of cols) {
    const name = col.split(" ")[0];
    try {
      await c.query(`ALTER TABLE serial_number_settings ADD COLUMN ${col}`);
      console.log("Added:", name);
    } catch (e) {
      if (e.message.includes("Duplicate")) {
        console.log("Already exists:", name);
      } else {
        console.error("Error adding", name, ":", e.message);
      }
    }
  }

  console.log("Done!");
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
