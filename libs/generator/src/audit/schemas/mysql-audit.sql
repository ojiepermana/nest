-- ============================================================================
-- Audit Log Schema - MySQL
-- ============================================================================
-- Comprehensive audit trail for all CRUD operations
-- Supports rollback functionality and compliance tracking
-- ============================================================================

-- ============================================================================
-- Audit Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Action details
  action VARCHAR(20) NOT NULL CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 
    'READ', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'CUSTOM'
  )),
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  
  -- User tracking
  user_id CHAR(36) NOT NULL,
  user_name VARCHAR(255),
  user_ip VARCHAR(45), -- IPv6 compatible
  user_agent TEXT,
  
  -- Change tracking
  old_values JSON,
  new_values JSON,
  changes JSON, -- Array of {field, old_value, new_value, data_type}
  
  -- Request context
  endpoint VARCHAR(500),
  method VARCHAR(10), -- GET, POST, PUT, DELETE, etc.
  status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
  error_message TEXT,
  
  -- Metadata
  metadata JSON,
  tags JSON, -- Array of tags for filtering
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Rollback support
  is_rolled_back BOOLEAN DEFAULT FALSE,
  rolled_back_at TIMESTAMP NULL,
  rolled_back_by CHAR(36),
  
  -- Foreign keys
  FOREIGN KEY (rolled_back_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_user (user_id),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_created_at (created_at DESC),
  INDEX idx_audit_logs_status (status),
  INDEX idx_audit_logs_entity_created (entity_type, entity_id, created_at DESC),
  INDEX idx_audit_logs_user_created (user_id, created_at DESC),
  INDEX idx_audit_logs_action_entity (action, entity_type),
  INDEX idx_audit_logs_rolled_back (is_rolled_back)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Archive Table (for old logs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs_archive (
  id CHAR(36) PRIMARY KEY,
  action VARCHAR(20) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  user_id CHAR(36) NOT NULL,
  user_name VARCHAR(255),
  user_ip VARCHAR(45),
  user_agent TEXT,
  old_values JSON,
  new_values JSON,
  changes JSON,
  endpoint VARCHAR(500),
  method VARCHAR(10),
  status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  error_message TEXT,
  metadata JSON,
  tags JSON,
  created_at TIMESTAMP NOT NULL,
  is_rolled_back BOOLEAN DEFAULT FALSE,
  rolled_back_at TIMESTAMP NULL,
  rolled_back_by CHAR(36),
  
  INDEX idx_archive_created_at (created_at DESC),
  INDEX idx_archive_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Stored Procedures
-- ============================================================================

DELIMITER //

-- Procedure to calculate changes between old and new values
CREATE PROCEDURE sp_calculate_changes(
  IN old_values_json JSON,
  IN new_values_json JSON,
  OUT changes_json JSON
)
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE key_name VARCHAR(255);
  DECLARE old_val JSON;
  DECLARE new_val JSON;
  DECLARE changes_array JSON DEFAULT JSON_ARRAY();
  
  -- Get all keys from new_values
  DECLARE cur CURSOR FOR 
    SELECT JSON_UNQUOTE(JSON_EXTRACT(JSON_KEYS(new_values_json), CONCAT('$[', idx, ']'))) AS key_name
    FROM (
      SELECT 0 AS idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
      UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    ) numbers
    WHERE idx < JSON_LENGTH(JSON_KEYS(new_values_json));
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO key_name;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    SET old_val = JSON_EXTRACT(old_values_json, CONCAT('$.', key_name));
    SET new_val = JSON_EXTRACT(new_values_json, CONCAT('$.', key_name));
    
    -- Compare values
    IF old_val IS DISTINCT FROM new_val THEN
      SET changes_array = JSON_ARRAY_APPEND(
        changes_array,
        '$',
        JSON_OBJECT(
          'field', key_name,
          'old_value', old_val,
          'new_value', new_val,
          'data_type', JSON_TYPE(new_val)
        )
      );
    END IF;
  END LOOP;
  
  CLOSE cur;
  SET changes_json = changes_array;
END //

-- Procedure to get entity history
CREATE PROCEDURE sp_get_entity_history(
  IN p_entity_type VARCHAR(100),
  IN p_entity_id VARCHAR(255),
  IN p_limit INT
)
BEGIN
  SELECT 
    id,
    action,
    user_name,
    old_values,
    new_values,
    changes,
    created_at
  FROM audit_logs
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
  ORDER BY created_at DESC
  LIMIT p_limit;
END //

-- Procedure to get user activity
CREATE PROCEDURE sp_get_user_activity(
  IN p_user_id CHAR(36),
  IN p_start_date TIMESTAMP,
  IN p_end_date TIMESTAMP
)
BEGIN
  SELECT 
    id,
    action,
    entity_type,
    entity_id,
    status,
    created_at
  FROM audit_logs
  WHERE user_id = p_user_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
  ORDER BY created_at DESC;
END //

-- Procedure to archive old logs
CREATE PROCEDURE sp_archive_old_logs(
  IN p_before_date TIMESTAMP,
  OUT p_archived_count INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_archived_count = 0;
  END;
  
  START TRANSACTION;
  
  -- Insert into archive
  INSERT INTO audit_logs_archive
  SELECT * FROM audit_logs
  WHERE created_at < p_before_date
    AND is_rolled_back = FALSE;
  
  -- Get count
  SET p_archived_count = ROW_COUNT();
  
  -- Delete from main table
  DELETE FROM audit_logs
  WHERE created_at < p_before_date
    AND is_rolled_back = FALSE;
  
  COMMIT;
END //

-- Procedure to get audit statistics
CREATE PROCEDURE sp_get_audit_stats(
  IN p_start_date TIMESTAMP,
  IN p_end_date TIMESTAMP
)
BEGIN
  SELECT 
    COUNT(*) as total_logs,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT entity_type) as unique_entity_types,
    SUM(CASE WHEN action = 'CREATE' THEN 1 ELSE 0 END) as create_count,
    SUM(CASE WHEN action = 'UPDATE' THEN 1 ELSE 0 END) as update_count,
    SUM(CASE WHEN action = 'DELETE' THEN 1 ELSE 0 END) as delete_count,
    SUM(CASE WHEN action = 'RESTORE' THEN 1 ELSE 0 END) as restore_count,
    SUM(CASE WHEN action = 'READ' THEN 1 ELSE 0 END) as read_count,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count,
    SUM(CASE WHEN is_rolled_back = TRUE THEN 1 ELSE 0 END) as rolled_back_count
  FROM audit_logs
  WHERE (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END //

DELIMITER ;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Trigger to automatically calculate changes on INSERT
DELIMITER //

CREATE TRIGGER trg_audit_logs_calculate_changes
BEFORE INSERT ON audit_logs
FOR EACH ROW
BEGIN
  DECLARE calculated_changes JSON;
  
  IF NEW.old_values IS NOT NULL AND NEW.new_values IS NOT NULL THEN
    CALL sp_calculate_changes(NEW.old_values, NEW.new_values, calculated_changes);
    SET NEW.changes = calculated_changes;
  END IF;
END //

DELIMITER ;

-- ============================================================================
-- Sample Queries
-- ============================================================================

-- Get recent activity
-- SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;

-- Get entity history
-- CALL sp_get_entity_history('users', '123', 50);

-- Get user activity
-- CALL sp_get_user_activity('user-uuid-here', '2024-01-01', '2024-12-31');

-- Get audit statistics
-- CALL sp_get_audit_stats('2024-01-01', '2024-12-31');

-- Search in JSON
-- SELECT * FROM audit_logs WHERE JSON_CONTAINS(changes, '{"field": "status"}');

-- Archive old logs (90 days)
-- CALL sp_archive_old_logs(DATE_SUB(NOW(), INTERVAL 90 DAY), @count);
-- SELECT @count;

-- ============================================================================
-- Partitioning Setup (Optional - MySQL 8.0+)
-- ============================================================================

-- Note: To enable partitioning, recreate table without foreign keys first
-- Then use PARTITION BY RANGE

-- ALTER TABLE audit_logs 
-- PARTITION BY RANGE (YEAR(created_at)) (
--   PARTITION p2024 VALUES LESS THAN (2025),
--   PARTITION p2025 VALUES LESS THAN (2026),
--   PARTITION p_future VALUES LESS THAN MAXVALUE
-- );
