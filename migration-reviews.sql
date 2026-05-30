-- Post-donation ratings & reviews
USE food_forward_db;

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
