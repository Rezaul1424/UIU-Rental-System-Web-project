ALTER TABLE `properties`
  MODIFY COLUMN `map_pin_x` DECIMAL(10, 7) NULL DEFAULT NULL,
  MODIFY COLUMN `map_pin_y` DECIMAL(10, 7) NULL DEFAULT NULL;

UPDATE `properties`
SET
  `map_pin_x` = CASE `property_code`
    WHEN 'UIU-1001' THEN 23.7989000
    WHEN 'UIU-1002' THEN 23.7935000
    WHEN 'UIU-1003' THEN 23.7989000
    WHEN 'UIU-1004' THEN 23.8009000
    ELSE NULL
  END,
  `map_pin_y` = CASE `property_code`
    WHEN 'UIU-1001' THEN 90.4525500
    WHEN 'UIU-1002' THEN 90.4496000
    WHEN 'UIU-1003' THEN 90.4633500
    WHEN 'UIU-1004' THEN 90.4520000
    ELSE NULL
  END
WHERE `map_pin_x` < 23.5
   OR `map_pin_x` > 24.2
   OR `map_pin_y` < 90
   OR `map_pin_y` > 91;
