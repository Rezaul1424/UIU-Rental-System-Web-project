SET @progress_stage_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'maintenance_requests'
    AND COLUMN_NAME = 'progress_stage'
);
SET @progress_stage_sql := IF(
  @progress_stage_exists = 0,
  'ALTER TABLE `maintenance_requests` ADD COLUMN `progress_stage` TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER `status`',
  'SELECT 1'
);
PREPARE add_progress_stage FROM @progress_stage_sql;
EXECUTE add_progress_stage;
DEALLOCATE PREPARE add_progress_stage;

UPDATE `maintenance_requests`
SET `progress_stage` = CASE `status`
  WHEN 'in-progress' THEN 3
  WHEN 'resolved' THEN 5
  ELSE 1
END;