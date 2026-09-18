-- Module 8 administrator listing moderation. Safe to apply repeatedly.

SET @moderation_column_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'properties'
    AND COLUMN_NAME = 'moderation_status'
);
SET @moderation_column_sql := IF(
  @moderation_column_exists = 0,
  "ALTER TABLE `properties` ADD COLUMN `moderation_status` ENUM('draft', 'pending', 'approved', 'rejected', 'suspended', 'archived') NOT NULL DEFAULT 'approved' AFTER `status`",
  'SELECT 1'
);
PREPARE add_moderation_column FROM @moderation_column_sql;
EXECUTE add_moderation_column;
DEALLOCATE PREPARE add_moderation_column;

UPDATE `properties`
SET `moderation_status` = 'approved'
WHERE `moderation_status` IS NULL OR `moderation_status` = '';

SET @moderation_index_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'properties'
    AND INDEX_NAME = 'idx_properties_moderation_status'
);
SET @moderation_index_sql := IF(
  @moderation_index_exists = 0,
  'CREATE INDEX `idx_properties_moderation_status` ON `properties` (`moderation_status`)',
  'SELECT 1'
);
PREPARE add_moderation_index FROM @moderation_index_sql;
EXECUTE add_moderation_index;
DEALLOCATE PREPARE add_moderation_index;
