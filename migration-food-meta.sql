-- Run once on food_forward_db to add food category, dietary, and allergen columns
USE food_forward_db;

ALTER TABLE donors
  ADD COLUMN food_category VARCHAR(100) DEFAULT NULL AFTER food_type,
  ADD COLUMN dietary_info VARCHAR(500) DEFAULT NULL AFTER food_category,
  ADD COLUMN allergen_info VARCHAR(500) DEFAULT NULL AFTER dietary_info;

-- If collected_food exists in your database, run:
-- ALTER TABLE collected_food
--   ADD COLUMN food_category VARCHAR(100) DEFAULT NULL AFTER food_type,
--   ADD COLUMN dietary_info VARCHAR(500) DEFAULT NULL AFTER food_category,
--   ADD COLUMN allergen_info VARCHAR(500) DEFAULT NULL AFTER dietary_info;
