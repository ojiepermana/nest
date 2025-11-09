-- ============================================================================
-- Audit Log Schema - PostgreSQL
-- ============================================================================
-- Comprehensive audit trail for all CRUD operations
-- Supports rollback functionality and compliance tracking
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS audit;

-- ============================================================================
-- Audit Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action details
  action varchar(20) NOT NULL CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'RESTORE', 
    'READ', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'CUSTOM'
  )),
  entity_type varchar(100) NOT NULL,
  entity_id varchar(255),
  
  -- User tracking
  user_id uuid NOT NULL,
  user_name varchar(255),
  user_ip varchar(45), -- IPv6 compatible
  user_agent text,
  
  -- Change tracking
  old_values jsonb,
  new_values jsonb,
  changes jsonb, -- Array of {field, old_value, new_value, data_type}
  
  -- Request context
  endpoint varchar(500),
  method varchar(10), -- GET, POST, PUT, DELETE, etc.
  status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
  error_message text,
  
  -- Metadata
  metadata jsonb,
  tags text[], -- Array of tags for filtering
  
  -- Timestamps
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Rollback support
  is_rolled_back boolean DEFAULT false,
  rolled_back_at timestamp,
  rolled_back_by uuid REFERENCES "user".users(id)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary queries
CREATE INDEX idx_audit_logs_entity ON audit.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_status ON audit.audit_logs(status);

-- Composite indexes for common queries
CREATE INDEX idx_audit_logs_entity_created ON audit.audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_created ON audit.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action_entity ON audit.audit_logs(action, entity_type);

-- JSONB indexes for change tracking
CREATE INDEX idx_audit_logs_old_values ON audit.audit_logs USING gin(old_values);
CREATE INDEX idx_audit_logs_new_values ON audit.audit_logs USING gin(new_values);
CREATE INDEX idx_audit_logs_metadata ON audit.audit_logs USING gin(metadata);

-- Array index for tags
CREATE INDEX idx_audit_logs_tags ON audit.audit_logs USING gin(tags);

-- Rollback queries
CREATE INDEX idx_audit_logs_rolled_back ON audit.audit_logs(is_rolled_back) WHERE is_rolled_back = true;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to calculate changes between old and new values
CREATE OR REPLACE FUNCTION audit.calculate_changes(
  old_values jsonb,
  new_values jsonb
) RETURNS jsonb AS $$
DECLARE
  changes jsonb := '[]'::jsonb;
  key text;
  change_item jsonb;
BEGIN
  -- Compare each field
  FOR key IN SELECT jsonb_object_keys(new_values)
  LOOP
    IF old_values->>key IS DISTINCT FROM new_values->>key THEN
      change_item := jsonb_build_object(
        'field', key,
        'old_value', old_values->key,
        'new_value', new_values->key,
        'data_type', jsonb_typeof(new_values->key)
      );
      changes := changes || jsonb_build_array(change_item);
    END IF;
  END LOOP;
  
  RETURN changes;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get entity history
CREATE OR REPLACE FUNCTION audit.get_entity_history(
  p_entity_type varchar,
  p_entity_id varchar,
  p_limit integer DEFAULT 100
) RETURNS TABLE(
  id uuid,
  action varchar,
  user_name varchar,
  old_values jsonb,
  new_values jsonb,
  changes jsonb,
  created_at timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.action,
    al.user_name,
    al.old_values,
    al.new_values,
    al.changes,
    al.created_at
  FROM audit.audit_logs al
  WHERE al.entity_type = p_entity_type
    AND al.entity_id = p_entity_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user activity
CREATE OR REPLACE FUNCTION audit.get_user_activity(
  p_user_id uuid,
  p_start_date timestamp DEFAULT NULL,
  p_end_date timestamp DEFAULT NULL
) RETURNS TABLE(
  id uuid,
  action varchar,
  entity_type varchar,
  entity_id varchar,
  status varchar,
  created_at timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.action,
    al.entity_type,
    al.entity_id,
    al.status,
    al.created_at
  FROM audit.audit_logs al
  WHERE al.user_id = p_user_id
    AND (p_start_date IS NULL OR al.created_at >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at <= p_end_date)
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old logs
CREATE OR REPLACE FUNCTION audit.archive_old_logs(
  p_before_date timestamp
) RETURNS integer AS $$
DECLARE
  archived_count integer;
BEGIN
  -- Move old logs to archive table (create if not exists)
  CREATE TABLE IF NOT EXISTS audit.audit_logs_archive (LIKE audit.audit_logs INCLUDING ALL);
  
  WITH moved AS (
    DELETE FROM audit.audit_logs
    WHERE created_at < p_before_date
      AND is_rolled_back = false
    RETURNING *
  )
  INSERT INTO audit.audit_logs_archive
  SELECT * FROM moved;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger for Automatic Change Calculation
-- ============================================================================

CREATE OR REPLACE FUNCTION audit.auto_calculate_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.old_values IS NOT NULL AND NEW.new_values IS NOT NULL THEN
    NEW.changes := audit.calculate_changes(NEW.old_values, NEW.new_values);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_calculate_changes
  BEFORE INSERT ON audit.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION audit.auto_calculate_changes();

-- ============================================================================
-- Partitioning Setup (Optional - for large datasets)
-- ============================================================================

-- Create partitioned table (optional, comment out if not needed)
-- CREATE TABLE audit.audit_logs_partitioned (LIKE audit.audit_logs INCLUDING ALL)
-- PARTITION BY RANGE (created_at);

-- Create monthly partitions
-- CREATE TABLE audit.audit_logs_2024_11 PARTITION OF audit.audit_logs_partitioned
-- FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

-- ============================================================================
-- Sample Queries
-- ============================================================================

-- Get recent activity
-- SELECT * FROM audit.audit_logs ORDER BY created_at DESC LIMIT 100;

-- Get entity history
-- SELECT * FROM audit.get_entity_history('users', '123');

-- Get user activity
-- SELECT * FROM audit.get_user_activity('user-uuid-here');

-- Search in changes
-- SELECT * FROM audit.audit_logs WHERE changes @> '[{"field": "status"}]';

-- Archive old logs (90 days)
-- SELECT audit.archive_old_logs(CURRENT_TIMESTAMP - INTERVAL '90 days');
