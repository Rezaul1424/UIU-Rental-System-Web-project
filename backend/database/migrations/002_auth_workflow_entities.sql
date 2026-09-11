-- Module 3 and shared workflow persistence. Safe to apply repeatedly.

ALTER TABLE `users`
  MODIFY COLUMN `status` ENUM('active', 'pending', 'suspended', 'deactivated') NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS `auth_sessions` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token_hash` CHAR(64) NOT NULL UNIQUE,
  `expires_at` TIMESTAMP NOT NULL,
  `revoked_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_auth_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_auth_sessions_user_active` (`user_id`, `revoked_at`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `token_hash` CHAR(64) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_password_reset_user` (`user_id`, `used_at`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `maintenance_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `maintenance_request_id` INT NOT NULL,
  `author_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_maintenance_comments_request` FOREIGN KEY (`maintenance_request_id`) REFERENCES `maintenance_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_maintenance_comments_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_maintenance_comments_request_created` (`maintenance_request_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `maintenance_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `maintenance_request_id` INT NOT NULL,
  `uploaded_by` INT NOT NULL,
  `storage_key` VARCHAR(255) NOT NULL UNIQUE,
  `mime_type` VARCHAR(100) NOT NULL,
  `size_bytes` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_maintenance_attachments_request` FOREIGN KEY (`maintenance_request_id`) REFERENCES `maintenance_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_maintenance_attachments_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_maintenance_attachments_request` (`maintenance_request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rent_obligations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lease_id` INT NOT NULL,
  `month_year` CHAR(7) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `due_date` DATE NOT NULL,
  `status` ENUM('pending', 'processing', 'paid', 'failed', 'refunded', 'disputed') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rent_obligations_lease` FOREIGN KEY (`lease_id`) REFERENCES `leases` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY `uk_rent_obligation_month` (`lease_id`, `month_year`),
  INDEX `idx_rent_obligations_status_due` (`status`, `due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_receipts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rent_obligation_id` INT NOT NULL UNIQUE,
  `receipt_number` VARCHAR(50) NOT NULL UNIQUE,
  `issued_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payment_receipts_obligation` FOREIGN KEY (`rent_obligation_id`) REFERENCES `rent_obligations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
