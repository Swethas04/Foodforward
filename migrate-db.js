/**
 * One-time / manual DB migration (same logic as server startup).
 * Run: node migrate-db.js
 */
const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Rmdec@2001",
  database: "food_forward_db",
  port: 3307,
});

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function columnExists(table, column) {
  const rows = await queryAsync(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function tableExists(table) {
  const rows = await queryAsync(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows[0].cnt > 0;
}

async function addColumnIfMissing(table, column, definition) {
  if (await columnExists(table, column)) {
    console.log(`OK  ${table}.${column} (already exists)`);
    return;
  }
  await queryAsync(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
  console.log(`ADD ${table}.${column}`);
}

async function main() {
  await new Promise((resolve, reject) => db.connect((err) => (err ? reject(err) : resolve())));
  console.log("Connected to food_forward_db\n");

  await addColumnIfMissing("donors", "food_category", "`food_category` VARCHAR(100) DEFAULT NULL AFTER `food_type`");
  await addColumnIfMissing("donors", "dietary_info", "`dietary_info` VARCHAR(500) DEFAULT NULL AFTER `food_category`");
  await addColumnIfMissing("donors", "allergen_info", "`allergen_info` VARCHAR(500) DEFAULT NULL AFTER `dietary_info`");
  await addColumnIfMissing("donors", "food_image", "`food_image` VARCHAR(255) DEFAULT NULL AFTER `allergen_info`");

  if (await tableExists("collected_food")) {
    await addColumnIfMissing("collected_food", "food_category", "`food_category` VARCHAR(100) DEFAULT NULL AFTER `food_type`");
    const afterCategory = (await columnExists("collected_food", "food_category")) ? "food_category" : "food_type";
    await addColumnIfMissing("collected_food", "dietary_info", `\`dietary_info\` VARCHAR(500) DEFAULT NULL AFTER \`${afterCategory}\``);
    const afterDietary = (await columnExists("collected_food", "dietary_info")) ? "dietary_info" : afterCategory;
    await addColumnIfMissing("collected_food", "allergen_info", `\`allergen_info\` VARCHAR(500) DEFAULT NULL AFTER \`${afterDietary}\``);
    const afterAllergen = (await columnExists("collected_food", "allergen_info")) ? "allergen_info" : afterDietary;
    await addColumnIfMissing("collected_food", "food_image", `\`food_image\` VARCHAR(255) DEFAULT NULL AFTER \`${afterAllergen}\``);
  }

  await queryAsync(`
    CREATE TABLE IF NOT EXISTS donation_reviews (
      id INT NOT NULL AUTO_INCREMENT,
      donation_number VARCHAR(20) NOT NULL,
      donor_name VARCHAR(255) NOT NULL,
      food_type VARCHAR(255) DEFAULT NULL,
      receiver_id INT DEFAULT NULL,
      receiver_name VARCHAR(255) NOT NULL,
      rating TINYINT NOT NULL,
      review_text TEXT,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_donation_number (donation_number),
      KEY idx_donor_name (donor_name),
      KEY idx_rating (rating),
      CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
  console.log("OK  donation_reviews table");

  console.log("\nMigration finished.");
  db.end();
}

main().catch((err) => {
  console.error(err);
  db.end();
  process.exit(1);
});
