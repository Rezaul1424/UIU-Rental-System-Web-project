-- Deterministic development-only fixtures. Do not use these credentials in production.
-- Password hash below is for the fake password: password123.

INSERT INTO `users` (`id`, `role`, `name`, `email`, `password_hash`, `status`, `is_verified`)
VALUES
  (7, 'landlord', 'Pending Landlord', 'pending-landlord@example.test', '$2a$10$f6f.vGvXhY1lX8LwH2eQkOG1N42i5T10d18.M96wZc.12h4q2wK1G', 'pending', FALSE),
  (8, 'landlord', 'Suspended Landlord', 'suspended-landlord@example.test', '$2a$10$f6f.vGvXhY1lX8LwH2eQkOG1N42i5T10d18.M96wZc.12h4q2wK1G', 'suspended', TRUE),
  (9, 'student', 'Pending Student', 'pending-student@example.test', '$2a$10$f6f.vGvXhY1lX8LwH2eQkOG1N42i5T10d18.M96wZc.12h4q2wK1G', 'pending', FALSE),
  (10, 'student', 'Suspended Student', 'suspended-student@example.test', '$2a$10$f6f.vGvXhY1lX8LwH2eQkOG1N42i5T10d18.M96wZc.12h4q2wK1G', 'suspended', TRUE)
ON DUPLICATE KEY UPDATE
  `role` = VALUES(`role`), `status` = VALUES(`status`), `is_verified` = VALUES(`is_verified`);

INSERT INTO `properties` (`id`, `property_code`, `landlord_id`, `title`, `description`, `type`, `price`, `distance_km`, `status`, `total_size_sqft`, `roommate_capacity`, `bedroom_count`, `bathroom_count`, `kitchen_count`, `address_area`)
VALUES (4, 'UIU-1004', 2, 'Occupied Campus Apartment', 'Development fixture for occupancy and lease tests.', 'Single', 5000.00, 0.45, 'occupied', 350, 1, 1, 1, 1, 'North Campus')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `price` = VALUES(`price`);

INSERT INTO `applications` (`property_id`, `student_id`, `landlord_id`, `student_card_no`, `contact_phone`, `move_in_date`, `employment`, `message`, `status`)
SELECT 1, 5, 2, '011211001', '+8801811223344', '2026-10-01', 'Student', 'Please review my application.', 'under-review'
WHERE NOT EXISTS (SELECT 1 FROM `applications` WHERE `property_id` = 1 AND `student_id` = 5 AND `status` = 'under-review');
INSERT INTO `applications` (`property_id`, `student_id`, `landlord_id`, `move_in_date`, `employment`, `status`)
SELECT 2, 6, 3, '2026-10-15', 'Student', 'accepted'
WHERE NOT EXISTS (SELECT 1 FROM `applications` WHERE `property_id` = 2 AND `student_id` = 6 AND `status` = 'accepted');
INSERT INTO `applications` (`property_id`, `student_id`, `landlord_id`, `move_in_date`, `employment`, `status`)
SELECT 3, 5, 4, '2026-11-01', 'Student', 'rejected'
WHERE NOT EXISTS (SELECT 1 FROM `applications` WHERE `property_id` = 3 AND `student_id` = 5 AND `status` = 'rejected');

INSERT INTO `leases` (`id`, `property_id`, `student_id`, `landlord_id`, `status`, `start_date`, `monthly_rent`)
VALUES (1, 4, 5, 2, 'active', '2026-01-01', 5000.00)
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `monthly_rent` = VALUES(`monthly_rent`);

INSERT INTO `maintenance_requests` (`property_id`, `student_id`, `landlord_id`, `issue`, `description`, `priority`, `status`)
SELECT 4, 5, 2, 'Water leak', 'Kitchen sink needs repair.', 'High', 'open'
WHERE NOT EXISTS (SELECT 1 FROM `maintenance_requests` WHERE `property_id` = 4 AND `student_id` = 5 AND `issue` = 'Water leak');
INSERT INTO `maintenance_requests` (`property_id`, `student_id`, `landlord_id`, `issue`, `description`, `priority`, `status`)
SELECT 4, 5, 2, 'Broken light', 'Bedroom light replaced.', 'Low', 'resolved'
WHERE NOT EXISTS (SELECT 1 FROM `maintenance_requests` WHERE `property_id` = 4 AND `student_id` = 5 AND `issue` = 'Broken light');

INSERT INTO `rent_payments` (`invoice_no`, `property_id`, `student_id`, `landlord_id`, `month_year`, `amount`, `status`, `payment_method`)
VALUES ('INV-DEV-2026-07', 4, 5, 2, '2026-07', 5000.00, 'paid', 'development-fixture')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `amount` = VALUES(`amount`);
INSERT INTO `rent_payments` (`invoice_no`, `property_id`, `student_id`, `landlord_id`, `month_year`, `amount`, `status`)
VALUES ('INV-DEV-2026-08', 4, 5, 2, '2026-08', 5000.00, 'pending')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `amount` = VALUES(`amount`);

INSERT INTO `reviews` (`property_id`, `student_id`, `landlord_id`, `landlord_stars`, `property_stars`, `comment`)
SELECT 4, 5, 2, 5, 4, 'Development fixture review.'
WHERE NOT EXISTS (SELECT 1 FROM `reviews` WHERE `property_id` = 4 AND `student_id` = 5);

INSERT INTO `conversations` (`student_id`, `landlord_id`, `property_id`)
SELECT 5, 2, 4
WHERE NOT EXISTS (SELECT 1 FROM `conversations` WHERE `student_id` = 5 AND `landlord_id` = 2 AND `property_id` = 4);
INSERT INTO `chat_messages` (`conversation_id`, `sender_id`, `message_text`)
SELECT `id`, 5, 'Development fixture message.'
FROM `conversations`
WHERE `student_id` = 5 AND `landlord_id` = 2 AND `property_id` = 4
  AND NOT EXISTS (
    SELECT 1 FROM `chat_messages` AS existing
    WHERE existing.`conversation_id` = `conversations`.`id`
      AND existing.`message_text` = 'Development fixture message.'
  );
