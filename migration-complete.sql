-- FoodForward: run once on an existing food_forward_db database
-- Use MySQL Workbench or: mysql -h 127.0.0.1 -P 3307 -u root -p < migration-complete.sql
-- Skip any ALTER that errors with "Duplicate column name" (column already exists).

USE food_forward_db;

-- Donors: food category, dietary tags, allergens (donate form + search filters)
ALTER TABLE donors
  ADD COLUMN food_category VARCHAR(100) DEFAULT NULL AFTER food_type,
  ADD COLUMN dietary_info VARCHAR(500) DEFAULT NULL AFTER food_category,
  ADD COLUMN allergen_info VARCHAR(500) DEFAULT NULL AFTER dietary_info;

-- Collected food: keep same fields when a donation is picked up
ALTER TABLE collected_food
  ADD COLUMN food_category VARCHAR(100) DEFAULT NULL AFTER food_type,
  ADD COLUMN dietary_info VARCHAR(500) DEFAULT NULL AFTER food_category,
  ADD COLUMN allergen_info VARCHAR(500) DEFAULT NULL AFTER dietary_info;

-- Post-pickup ratings (feedback page, reviews page, search donor ratings)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
