/**
 * Seed 500 random students with pending enrollment status.
 * Usage: node database/seed-students.js
 */

const mysql = require("mysql2/promise");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "geolocation_rotc_cwts_system";

const TOTAL = 500;

const FIRST_NAMES_MALE = ["James","John","Mark","Paul","Michael","Joshua","Angelo","Carl","Kenneth","Ivan","Rafael","Gabriel","Nathan","Daniel","Christian","Andrei","Kyle","Kevin","Justin","Ryan","Alex","Bryan","Vincent","Ericson","Jayson","Renzo","Marco","Cedric","Darwin","Elijah"];
const FIRST_NAMES_FEMALE = ["Maria","Ana","Christine","Angelica","Jessica","Michelle","Rose","Nicole","Jasmine","Patricia","Camille","Denise","Kimberly","Stephanie","Samantha","Clarisse","Diane","Erica","Fatima","Grace","Hannah","Isabelle","Joy","Katherine","Lyka","Megan","Noelle","Olivia","Paula","Queen"];
const LAST_NAMES = ["Santos","Reyes","Cruz","Garcia","Mendoza","Torres","Flores","Rivera","Lopez","Gonzales","Ramos","Bautista","Villanueva","Fernandez","Castro","Dela Cruz","Aquino","Mercado","Pascual","Dizon","Soriano","Salazar","Aguilar","Navarro","Morales","Perez","Manalo","Valdez","Tolentino","Hernandez","Miranda","Espinosa","Lim","Tan","Sy","Go","Ong","Chua","Velasco","Santiago"];
const MIDDLE_NAMES = ["Andrade","Bueno","Cortez","David","Enriquez","Francisco","Gutierrez","Hernandez","Ignacio","Jimenez","","","",""];
const RELIGIONS = ["Roman Catholic","Born Again","Iglesia ni Cristo","Muslim","Baptist","Methodist","Seventh Day Adventist"];
const COURSES = ["BS Criminology","BS Hospitality Management","BS Information Technology","BS Tourism Management","BEED - Bachelor of Elementary Education","BSED - Major in English","BSED - Major in Mathematics"];
const YEAR_LEVELS = ["1st Year","2nd Year","3rd Year","4th Year"];
const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-","N/A"];
const COMPLEXIONS = ["Fair","Brown","Dark","Light"];
const MUNICIPALITIES = ["Balanga","Orion","Pilar","Bagac","Mariveles","Limay","Hermosa","Samal","Abucay","Morong","Dinalupihan","Orani"];
const PROVINCES = ["Bataan","Pampanga","Bulacan","Zambales","Tarlac"];
const BARANGAYS = ["Poblacion","San Jose","San Roque","Bagumbayan","Mabini","Rizal","Magsaysay","Burgos","Quezon","Aguinaldo","Bonifacio","Del Pilar"];
const OCCUPATIONS = ["Farmer","Teacher","OFW","Driver","Vendor","Government Employee","Self-employed","Engineer","Nurse","Police","Fisherman","Carpenter"];
const RELATIONSHIPS = ["Mother","Father","Sister","Brother","Aunt","Uncle","Grandmother","Grandfather"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function padZero(n, len) { return String(n).padStart(len, "0"); }

function generateStudentId() {
  return `${padZero(randInt(2020, 2026), 6).slice(0,4)}${padZero(randInt(10,99),2)}-${padZero(randInt(1, 9999), 4)}`;
}

function generatePhone() {
  return `09${padZero(randInt(100000000, 999999999), 9)}`;
}

function generateBirthdate() {
  const year = randInt(2000, 2006);
  const month = padZero(randInt(1, 12), 2);
  const day = padZero(randInt(1, 28), 2);
  return `${year}-${month}-${day}`;
}

function generateHeight() {
  const feet = randInt(4, 6);
  const inches = randInt(0, 11);
  return `${feet}'${inches}"`;
}

function generatePlaceholderImage() {
  const colors = ["4A90D9","E74C3C","27AE60","F39C12","8E44AD","2C3E50","16A085","D35400"];
  const color = rand(colors);
  return `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#${color}"/><text x="100" y="110" text-anchor="middle" fill="white" font-size="60" font-family="Arial">ID</text></svg>`).toString("base64")}`;
}

async function main() {
  console.log(`Seeding ${TOTAL} random students...\n`);

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  const scheduleRotc = "ROTC_1_2026-2027";
  const scheduleCwts = "CWTS_1_2026-2027";
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const photo = generatePlaceholderImage();

  let inserted = 0;

  for (let i = 0; i < TOTAL; i++) {
    const sex = Math.random() > 0.5 ? "Male" : "Female";
    const firstName = sex === "Male" ? rand(FIRST_NAMES_MALE) : rand(FIRST_NAMES_FEMALE);
    const lastName = rand(LAST_NAMES);
    const middleName = rand(MIDDLE_NAMES);
    const suffix = Math.random() > 0.95 ? "JR." : null;
    const course = rand(COURSES);
    const nstpComponent = course === "BS Criminology" ? "ROTC" : rand(["ROTC", "CWTS"]);
    const studentId = generateStudentId();
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(1,999)}@student.bcc.edu.ph`;
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${randInt(1,999)}`;
    const password = "student123";
    const hasMedical = Math.random() > 0.9 ? 1 : 0;
    const medicalCondition = hasMedical ? rand(["Asthma","Hypertension","Diabetes","Scoliosis","Heart Condition"]) : "";
    const willingAdvance = nstpComponent === "ROTC" && !hasMedical && Math.random() > 0.85 ? 1 : 0;
    const willingMedics = nstpComponent === "ROTC" && !hasMedical && !willingAdvance && course !== "BS Criminology" && Math.random() > 0.9 ? 1 : 0;
    const willingMP = nstpComponent === "ROTC" && !hasMedical && !willingAdvance && !willingMedics && course !== "BS Criminology" && Math.random() > 0.9 ? 1 : 0;

    try {
      const [result] = await conn.execute(
        `INSERT INTO students (
          student_id, last_name, first_name, middle_name, suffix,
          religion, birthdate, sex, contact_number, place_of_birth,
          temporary_barangay, temporary_municipality, temporary_province,
          permanent_barangay, permanent_municipality, permanent_province,
          father_name, father_occupation, mother_name, mother_occupation,
          emergency_contact_name, emergency_contact_address, emergency_contact_relationship, emergency_contact_contact_number,
          willing_to_take_advance_course, willing_to_be_medics, willing_to_be_military_police,
          course, year_level, nstp_component,
          height, weight, blood_type, complexion,
          has_medical_condition, medical_condition,
          email, username, password, photo,
          role, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          studentId, lastName, firstName, middleName, suffix,
          rand(RELIGIONS), generateBirthdate(), sex, generatePhone(), `${rand(MUNICIPALITIES)}, ${rand(PROVINCES)}`,
          rand(BARANGAYS), rand(MUNICIPALITIES), rand(PROVINCES),
          rand(BARANGAYS), rand(MUNICIPALITIES), rand(PROVINCES),
          `${rand(FIRST_NAMES_MALE)} ${rand(LAST_NAMES)}`, rand(OCCUPATIONS),
          `${rand(FIRST_NAMES_FEMALE)} ${rand(LAST_NAMES)}`, rand(OCCUPATIONS),
          `${rand(FIRST_NAMES_MALE)} ${rand(LAST_NAMES)}`, `${rand(BARANGAYS)}, ${rand(MUNICIPALITIES)}`, rand(RELATIONSHIPS), generatePhone(),
          willingAdvance, willingMedics, willingMP,
          course, rand(YEAR_LEVELS), nstpComponent,
          generateHeight(), `${randInt(45, 95)}`, rand(BLOOD_TYPES), rand(COMPLEXIONS),
          hasMedical, medicalCondition,
          email, username, password, photo,
          "student", now, now,
        ]
      );

      const studentDbId = result.insertId;
      const scheduleId = nstpComponent === "ROTC" ? scheduleRotc : scheduleCwts;

      await conn.execute(
        `INSERT INTO student_ms_records (student_id, schedule_id, ms_level, status, program, created_at, updated_at)
         VALUES (?, ?, '1', 'pending', ?, ?, ?)`,
        [studentDbId, scheduleId, nstpComponent, now, now]
      );

      inserted++;
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") continue;
      console.error(`  Error on student #${i + 1}:`, err.message);
    }
  }

  await conn.end();
  console.log(`Done! Inserted ${inserted} students with 'pending' status.`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
