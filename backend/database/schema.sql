-- ==============================================================================
-- UIU Rental System - MySQL Database Schema
-- Target Engine: MySQL 8.0+
-- Database: uiu_rental_system
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `uiu_rental_system`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `uiu_rental_system`;

-- Disable foreign key checks while resetting/creating tables
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `complaint_replies`;
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `conversations`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `maintenance_requests`;
DROP TABLE IF EXISTS `rent_payments`;
DROP TABLE IF EXISTS `applications`;
DROP TABLE IF EXISTS `property_amenities`;
DROP TABLE IF EXISTS `amenities`;
DROP TABLE IF EXISTS `property_images`;
DROP TABLE IF EXISTS `properties`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role` ENUM('student', 'landlord', 'admin') NOT NULL DEFAULT 'student',
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `student_id` VARCHAR(30) DEFAULT NULL,
  `department` VARCHAR(50) DEFAULT NULL,
  `nid_number` VARCHAR(50) DEFAULT NULL,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `status` ENUM('active', 'pending', 'suspended', 'deactivated') NOT NULL DEFAULT 'active',
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. PROPERTIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE `properties` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_code` VARCHAR(30) NOT NULL UNIQUE,
  `landlord_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `type` ENUM('Single', 'Shared', 'Mess', 'Sublet') NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `distance_km` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('available', 'occupied', 'maintenance') NOT NULL DEFAULT 'available',
  `total_size_sqft` INT DEFAULT NULL,
  `roommate_capacity` INT NOT NULL DEFAULT 1,
  `parking` VARCHAR(50) NOT NULL DEFAULT 'Not Available',
  `bedroom_count` INT NOT NULL DEFAULT 1,
  `living_count` INT NOT NULL DEFAULT 0,
  `bathroom_count` INT NOT NULL DEFAULT 1,
  `kitchen_count` INT NOT NULL DEFAULT 1,
  `veranda_count` INT NOT NULL DEFAULT 0,
  `room_sizes_json` JSON DEFAULT NULL,
  `address_street` VARCHAR(255) DEFAULT NULL,
  `address_area` VARCHAR(100) DEFAULT NULL,
  `address_city` VARCHAR(50) NOT NULL DEFAULT 'Dhaka',
  `address_postal` VARCHAR(20) DEFAULT NULL,
  `map_pin_x` DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
  `map_pin_y` DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_properties_landlord`
    FOREIGN KEY (`landlord_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_properties_type` (`type`),
  INDEX `idx_properties_price` (`price`),
  INDEX `idx_properties_status` (`status`),
  INDEX `idx_properties_distance` (`distance_km`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. PROPERTY IMAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE `property_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` INT NOT NULL,
  `room_label` VARCHAR(50) NOT NULL DEFAULT 'General',
  `image_url` VARCHAR(500) NOT NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_property_images_property`
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_property_images_property` (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. AMENITIES & PROPERTY_AMENITIES TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE `amenities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `icon` VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `property_amenities` (
  `property_id` INT NOT NULL,
  `amenity_id` INT NOT NULL,
  PRIMARY KEY (`property_id`, `amenity_id`),
  CONSTRAINT `fk_pa_property`
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pa_amenity`
    FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. RENTAL APPLICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE `applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `landlord_id` INT NOT NULL,
  `student_card_no` VARCHAR(30) DEFAULT NULL,
  `contact_phone` VARCHAR(20) DEFAULT NULL,
  `move_in_date` DATE NOT NULL,
  `employment` VARCHAR(50) NOT NULL DEFAULT 'Student',
  `message` TEXT DEFAULT NULL,
  `status` ENUM('under-review', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'under-review',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_applications_property`
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_applications_student`
    FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_applications_landlord`
    FOREIGN KEY (`landlord_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_applications_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. RENT PAYMENTS & TRANSACTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE `rent_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_no` VARCHAR(50) NOT NULL UNIQUE,
  `property_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `landlord_id` INT NOT NULL,
  `month_year` VARCHAR(30) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pending', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
  `payment_method` VARCHAR(50) DEFAULT NULL,
  `transaction_id` VARCHAR(100) DEFAULT NULL,
  `paid_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rent_property`
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rent_student`
    FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rent_landlord`
    FOREIGN KEY (`landlord_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_rent_status` (`status`),
  INDEX `idx_rent_month_year` (`month_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. MAINTENANCE REQUESTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE `maintenance_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `landlord_id` INT NOT NULL,
  `issue` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `priority` ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  `status` ENUM('open', 'in-progress', 'resolved') NOT NULL DEFAULT 'open',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_maint_property`
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_maint_student`
    FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_maint_landlord`
    FOREIGN KEY (`landlord_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_maint_status` (`status`),
  INDEX `idx_maint_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. REVIEWS & RATINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `property_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `landlord_id` INT NOT NULL,
  `landlord_stars` TINYINT UNSIGNED NOT NULL CHECK (`landlord_stars` BETWEEN 1 AND 5),
  `property_stars` TINYINT UNSIGNED NOT NULL CHECK (`property_stars` BETWEEN 1 AND 5),
  `comment` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_reviews_property`
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_student`
    FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_landlord`
    FOREIGN KEY (`landlord_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. STUDENT FAVORITES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE `favorites` (
  `student_id` INT NOT NULL,
  `property_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`, `property_id`),
  CONSTRAINT `fk_favorites_student`
    FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_favorites_property`
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. CHAT CONVERSATIONS & MESSAGES TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE `conversations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `landlord_id` INT NOT NULL,
  `property_id` INT NOT NULL,
  `status` ENUM('active', 'archived') NOT NULL DEFAULT 'active',
  `last_message_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_conv_student`
    FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_conv_landlord`
    FOREIGN KEY (`landlord_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_conv_property`
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uk_conv_parties` (`student_id`, `landlord_id`, `property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL,
  `sender_id` INT NOT NULL,
  `message_text` TEXT NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_chat_conv`
    FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_sender`
    FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_chat_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. ADMIN COMPLAINTS & REPLIES TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE `complaints` (
  `id` VARCHAR(30) PRIMARY KEY,
  `complainant_id` INT NOT NULL,
  `accused_id` INT NOT NULL,
  `property_id` INT DEFAULT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('Submitted', 'Under Review', 'Responded', 'Resolved', 'Closed') NOT NULL DEFAULT 'Submitted',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_comp_complainant`
    FOREIGN KEY (`complainant_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comp_accused`
    FOREIGN KEY (`accused_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comp_property`
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_complaints_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `complaint_replies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` VARCHAR(30) NOT NULL,
  `sender_id` INT NOT NULL,
  `message_text` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cr_complaint`
    FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cr_sender`
    FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'general',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `link_url` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notif_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_notif_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- INITIAL SEED DATA (Matching UIU vicinity landmarks & Frontend Prototype)
-- ==============================================================================

-- 1. Seed Amenities
INSERT INTO `amenities` (`id`, `name`, `icon`) VALUES
  (1, 'AC', 'snowflake'),
  (2, 'WiFi', 'wifi'),
  (3, 'Laundry', 'washing-machine'),
  (4, 'Meals', 'utensils'),
  (5, 'CCTV', 'camera'),
  (6, 'Parking', 'car'),
  (7, 'Generator', 'zap'),
  (8, 'Gas', 'flame'),
  (9, 'Lift', 'elevator')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Seed Users
-- Passwords below are hashed for 'password123' via bcrypt
INSERT INTO `users` (`id`, `role`, `name`, `email`, `password_hash`, `phone`, `student_id`, `department`, `status`, `is_verified`) VALUES
  (1, 'admin', 'Admin User', 'admin@uiu.ac.bd', '$2a$10$f6f.vGvXhY1lX8LwH2eQkOG1N42i5T10d18.M96wZc.12h4q2wK1G', '+8801700000001', NULL, 'Administration', 'active', TRUE),
  (2, 'landlord', 'Rahman Faruk', 'faruk@example.com', '$2a$10$f6f.vGvXhY1lX8LwH2eQkOG1N42i5T10d18.M96wZc.12h4q2wK1G', '+8801711122233', NULL, NULL, 'active', TRUE),
  (3, 'landlord', 'Nusrat Jahan', 'nusrat@example.com', '$2a$10$f6f.vGvXhY1lX8LwH2eQkOG1N42i5T10d18.M96wZc.12h4q2wK1G', '+8801711122234', NULL, NULL, 'active', TRUE),
  (4, 'landlord', 'Karim Abdullah', 'karim@example.com', '$2a$10$f6f.vGvXhY1lX8LwH2eQkOG1N42i5T10d18.M96wZc.12h4q2wK1G', '+8801711122235', NULL, NULL, 'active', TRUE),
  (5, 'student', 'Tanvir Ahmed', 'tanvir@uiu.ac.bd', '$2a$10$f6f.vGvXhY1lX8LwH2eQkOG1N42i5T10d18.M96wZc.12h4q2wK1G', '+8801811223344', '011211001', 'CSE', 'active', TRUE),
  (6, 'student', 'Sadia Islam', 'sadia@uiu.ac.bd', '$2a$10$f6f.vGvXhY1lX8LwH2eQkOG1N42i5T10d18.M96wZc.12h4q2wK1G', '+8801811223345', '011211002', 'BBA', 'active', TRUE)
ON DUPLICATE KEY UPDATE `email`=VALUES(`email`);

-- 3. Seed Properties
INSERT INTO `properties` (`id`, `property_code`, `landlord_id`, `title`, `description`, `type`, `price`, `distance_km`, `status`, `total_size_sqft`, `roommate_capacity`, `parking`, `bedroom_count`, `living_count`, `bathroom_count`, `kitchen_count`, `veranda_count`, `room_sizes_json`, `address_street`, `address_area`, `map_pin_x`, `map_pin_y`) VALUES
  (1, 'UIU-1001', 2, 'Studio near Gate 3', 'Cozy modern studio apartment walking distance to UIU campus Gate 3. Fully tiled with AC and high-speed fiber WiFi.', 'Single', 4200.00, 0.30, 'available', 280, 1, 'Not Available', 1, 0, 1, 1, 0, '{"bedroom": 120, "bathroom": 45, "kitchen": 60}', 'Road 4, House 12', 'Gate 3 Area, North Campus', 50.00, 34.00),
  (2, 'UIU-1002', 3, 'Shared Mess – South Campus', 'Spacious bachelor mess with 3 times meals included, dedicated cook, and 24/7 CCTV surveillance.', 'Mess', 2800.00, 0.60, 'available', 460, 4, 'Not Available', 2, 1, 2, 1, 0, '{"bedroom": 100, "living": 150, "bathroom": 40, "kitchen": 70}', 'South Avenue, Block B', 'Gate 1 Area, South Campus', 50.00, 66.00),
  (3, 'UIU-1003', 4, 'Sublet – Bashundhara R/A', 'Premium sublet room in a residential apartment in Bashundhara R/A. Features full generator backup, lift, and balcony.', 'Sublet', 3500.00, 1.20, 'available', 620, 2, 'Available (Motorcycle)', 2, 1, 2, 1, 1, '{"bedroom": 140, "living": 180, "bathroom": 50, "kitchen": 75, "veranda": 40}', 'Road 11, Block D', 'Bashundhara R/A', 57.00, 37.00)
ON DUPLICATE KEY UPDATE `property_code`=VALUES(`property_code`);

-- 4. Seed Property Amenities
INSERT IGNORE INTO `property_amenities` (`property_id`, `amenity_id`) VALUES
  (1, 1), (1, 2), (1, 3), -- Prop 1: AC, WiFi, Laundry
  (2, 4), (2, 2), (2, 5), -- Prop 2: Meals, WiFi, CCTV
  (3, 1), (3, 6), (3, 7); -- Prop 3: AC, Parking, Generator

-- 5. Seed Property Images
INSERT INTO `property_images` (`property_id`, `room_label`, `image_url`, `is_primary`) VALUES
  (1, 'General', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=380&fit=crop&auto=format', TRUE),
  (1, 'Bedroom', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop&auto=format', FALSE),
  (1, 'Kitchen', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop&auto=format', FALSE),
  (2, 'General', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=380&fit=crop&auto=format', TRUE),
  (3, 'General', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=380&fit=crop&auto=format', TRUE);

-- 6. Seed Sample Complaints
INSERT INTO `complaints` (`id`, `complainant_id`, `accused_id`, `property_id`, `category`, `description`, `status`) VALUES
  ('CMP-001', 5, 2, 1, 'Maintenance Neglect', 'Reported the AC cooling issue on July 10th but no response received from the landlord.', 'Under Review'),
  ('CMP-002', 2, 6, 2, 'Late Payment', 'Rent for July 2026 has not been paid despite multiple reminders.', 'Submitted')
ON DUPLICATE KEY UPDATE `id`=VALUES(`id`);

INSERT INTO `complaint_replies` (`complaint_id`, `sender_id`, `message_text`) VALUES
  ('CMP-001', 1, 'We have received your complaint and are reviewing it with the landlord.');

