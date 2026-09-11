-- Module 5 shared entities. This migration is safe to run repeatedly.

CREATE TABLE IF NOT EXISTS `listing_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(80) NOT NULL UNIQUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @category_column_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'properties'
    AND COLUMN_NAME = 'category_id'
);
SET @category_column_sql := IF(
  @category_column_exists = 0,
  'ALTER TABLE `properties` ADD COLUMN `category_id` INT NULL',
  'SELECT 1'
);
PREPARE add_category_column FROM @category_column_sql;
EXECUTE add_category_column;
DEALLOCATE PREPARE add_category_column;

SET @category_fk_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'properties'
    AND CONSTRAINT_NAME = 'fk_properties_category'
);
SET @category_fk_sql := IF(
  @category_fk_exists = 0,
  'ALTER TABLE `properties` ADD CONSTRAINT `fk_properties_category` FOREIGN KEY (`category_id`) REFERENCES `listing_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE add_category_fk FROM @category_fk_sql;
EXECUTE add_category_fk;
DEALLOCATE PREPARE add_category_fk;

CREATE TABLE IF NOT EXISTS `addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` INT NOT NULL UNIQUE,
  `street` VARCHAR(255) DEFAULT NULL,
  `area` VARCHAR(100) DEFAULT NULL,
  `city` VARCHAR(50) NOT NULL DEFAULT 'Dhaka',
  `postal_code` VARCHAR(20) DEFAULT NULL,
  `latitude` DECIMAL(10, 7) DEFAULT NULL,
  `longitude` DECIMAL(10, 7) DEFAULT NULL,
  `geocode_status` ENUM('pending', 'resolved', 'failed') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_addresses_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_addresses_coordinates` (`latitude`, `longitude`),
  INDEX `idx_addresses_geocode_status` (`geocode_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `property_rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` INT NOT NULL,
  `room_name` VARCHAR(50) NOT NULL,
  `size_sqft` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_property_rooms_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uk_property_room_name` (`property_id`, `room_name`),
  INDEX `idx_property_rooms_property` (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `landlord_id` INT NOT NULL,
  `status` ENUM('pending', 'active', 'ended', 'terminated') NOT NULL DEFAULT 'pending',
  `start_date` DATE NOT NULL,
  `end_date` DATE DEFAULT NULL,
  `monthly_rent` DECIMAL(10, 2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_leases_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_leases_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_leases_landlord` FOREIGN KEY (`landlord_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_leases_property_status` (`property_id`, `status`),
  INDEX `idx_leases_student_status` (`student_id`, `status`),
  INDEX `idx_leases_landlord_status` (`landlord_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_events` (
  `id` CHAR(36) PRIMARY KEY,
  `actor_id` INT DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `resource_type` VARCHAR(80) NOT NULL,
  `resource_id` VARCHAR(80) NOT NULL,
  `previous_state` JSON DEFAULT NULL,
  `new_state` JSON DEFAULT NULL,
  `request_metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_events_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_audit_resource` (`resource_type`, `resource_id`),
  INDEX `idx_audit_actor_created` (`actor_id`, `created_at`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `listing_categories` (`name`) VALUES
  ('Apartment'), ('Room'), ('Mess'), ('Sublet')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `addresses` (`property_id`, `street`, `area`, `city`, `geocode_status`)
SELECT `id`, `address_street`, `address_area`, `address_city`, 'pending'
FROM `properties`
WHERE NOT EXISTS (
  SELECT 1 FROM `addresses` WHERE `addresses`.`property_id` = `properties`.`id`
);

INSERT INTO `property_rooms` (`property_id`, `room_name`, `size_sqft`)
SELECT `id`, 'Bedroom', JSON_UNQUOTE(JSON_EXTRACT(`room_sizes_json`, '$.bedroom'))
FROM `properties`
WHERE JSON_EXTRACT(`room_sizes_json`, '$.bedroom') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `property_rooms`
    WHERE `property_rooms`.`property_id` = `properties`.`id`
      AND `property_rooms`.`room_name` = 'Bedroom'
  );
