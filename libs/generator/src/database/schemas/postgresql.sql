-- ==============================================================================
-- NestJS Generator Metadata Schema - PostgreSQL
-- ==============================================================================
-- This schema stores metadata for automatic CRUD module generation.
-- Tables: meta.table_metadata, meta.column_metadata, meta.generated_files
-- Requires: PostgreSQL 12+ for generated columns and advanced JSON features
-- ==============================================================================

-- Create schema for metadata
CREATE SCHEMA IF NOT EXISTS meta;

-- ==============================================================================
-- UUID v7 Function (Time-ordered UUIDs)
-- ==============================================================================
-- Generates UUID v7 which is time-ordered and more efficient for indexing
-- Format: timestamp (48 bits) + version (4 bits) + random (12 bits) + variant (2 bits) + random (62 bits)

CREATE OR REPLACE FUNCTION meta.uuid_generate_v7()
RETURNS uuid
AS $$
DECLARE
  unix_ts_ms BIGINT;
  uuid_bytes BYTEA;
BEGIN
  -- Get current Unix timestamp in milliseconds
  unix_ts_ms := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
  
  -- Generate random bytes
  uuid_bytes := gen_random_bytes(16);
  
  -- Set timestamp (48 bits)
  uuid_bytes := set_byte(uuid_bytes, 0, (unix_ts_ms >> 40)::INT);
  uuid_bytes := set_byte(uuid_bytes, 1, (unix_ts_ms >> 32)::INT);
  uuid_bytes := set_byte(uuid_bytes, 2, (unix_ts_ms >> 24)::INT);
  uuid_bytes := set_byte(uuid_bytes, 3, (unix_ts_ms >> 16)::INT);
  uuid_bytes := set_byte(uuid_bytes, 4, (unix_ts_ms >> 8)::INT);
  uuid_bytes := set_byte(uuid_bytes, 5, unix_ts_ms::INT);
  
  -- Set version to 7 (0111) in bits 48-51
  uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
  
  -- Set variant to RFC 4122 (10) in bits 64-65
  uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);
  
  RETURN encode(uuid_bytes, 'hex')::uuid;
END
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION meta.uuid_generate_v7() IS 'Generate time-ordered UUID v7 for better indexing performance';

-- ==============================================================================
-- Table: meta.table_metadata
-- ==============================================================================
-- Stores metadata configuration for each table to be generated as CRUD module

CREATE TABLE IF NOT EXISTS meta.table_metadata (
  id UUID PRIMARY KEY DEFAULT meta.uuid_generate_v7(),
  
  -- Table identification
  schema_name VARCHAR(63) NOT NULL,
  table_name VARCHAR(63) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Module configuration
  module_name VARCHAR(100) NOT NULL,
  entity_name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20),
  
  -- Table type and behavior
  table_type VARCHAR(20) NOT NULL DEFAULT 'master',
  has_soft_delete BOOLEAN NOT NULL DEFAULT false,
  has_created_by BOOLEAN NOT NULL DEFAULT true,
  has_updated_by BOOLEAN NOT NULL DEFAULT true,
  
  -- Pagination
  default_page_size INT NOT NULL DEFAULT 20,
  max_page_size INT NOT NULL DEFAULT 100,
  
  -- Performance
  cache_enabled BOOLEAN NOT NULL DEFAULT false,
  cache_ttl INT DEFAULT 300,
  
  -- Rate limiting
  throttle_enabled BOOLEAN NOT NULL DEFAULT true,
  throttle_limit INT DEFAULT 100,
  throttle_ttl INT DEFAULT 60,
  
  -- Advanced features
  enable_export BOOLEAN NOT NULL DEFAULT true,
  enable_import BOOLEAN NOT NULL DEFAULT false,
  enable_recap BOOLEAN NOT NULL DEFAULT false,
  enable_search BOOLEAN NOT NULL DEFAULT false,
  
  -- Database partitioning
  is_partitioned BOOLEAN NOT NULL DEFAULT false,
  partition_type VARCHAR(20),
  partition_key VARCHAR(63),
  
  -- Permissions
  permission_config JSONB,
  
  -- Metadata tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT table_metadata_schema_table_uk UNIQUE (schema_name, table_name),
  CONSTRAINT table_metadata_module_uk UNIQUE (module_name),
  CONSTRAINT table_metadata_table_type_ck CHECK (table_type IN ('master', 'transaction', 'reference', 'junction')),
  CONSTRAINT table_metadata_partition_type_ck CHECK (
    partition_type IS NULL OR 
    partition_type IN ('range', 'list', 'hash')
  ),
  CONSTRAINT table_metadata_partition_key_ck CHECK (
    (is_partitioned = false AND partition_type IS NULL AND partition_key IS NULL) OR
    (is_partitioned = true AND partition_type IS NOT NULL AND partition_key IS NOT NULL)
  ),
  CONSTRAINT table_metadata_cache_ttl_ck CHECK (
    (cache_enabled = false AND cache_ttl IS NULL) OR
    (cache_enabled = true AND cache_ttl > 0)
  ),
  CONSTRAINT table_metadata_throttle_ck CHECK (
    (throttle_enabled = false) OR
    (throttle_enabled = true AND throttle_limit > 0 AND throttle_ttl > 0)
  ),
  CONSTRAINT table_metadata_page_size_ck CHECK (
    default_page_size > 0 AND 
    max_page_size >= default_page_size
  )
);

-- Indexes for table_metadata
CREATE INDEX IF NOT EXISTS idx_table_metadata_schema_table ON meta.table_metadata(schema_name, table_name);
CREATE INDEX IF NOT EXISTS idx_table_metadata_module ON meta.table_metadata(module_name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_table_metadata_is_active ON meta.table_metadata(is_active);
CREATE INDEX IF NOT EXISTS idx_table_metadata_created_at ON meta.table_metadata(created_at);

-- Comments
COMMENT ON TABLE meta.table_metadata IS 'Configuration metadata for automatic CRUD module generation';
COMMENT ON COLUMN meta.table_metadata.table_type IS 'master=main entities, transaction=event records, reference=lookup data, junction=many-to-many';
COMMENT ON COLUMN meta.table_metadata.permission_config IS 'RBAC configuration: roles, permissions, field-level access';
COMMENT ON COLUMN meta.table_metadata.partition_type IS 'PostgreSQL partitioning: range (date/numeric), list (enum), hash (UUID)';

-- ==============================================================================
-- Table: meta.column_metadata
-- ==============================================================================
-- Stores metadata for each column including validation, display, and behavior

CREATE TABLE IF NOT EXISTS meta.column_metadata (
  id UUID PRIMARY KEY DEFAULT meta.uuid_generate_v7(),
  
  -- Column identification
  table_id UUID NOT NULL REFERENCES meta.table_metadata(id) ON DELETE CASCADE,
  column_name VARCHAR(63) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  
  -- Display configuration
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  placeholder VARCHAR(255),
  help_text TEXT,
  
  -- Visibility flags
  display_in_list BOOLEAN NOT NULL DEFAULT true,
  display_in_form BOOLEAN NOT NULL DEFAULT true,
  display_in_detail BOOLEAN NOT NULL DEFAULT true,
  display_in_filter BOOLEAN NOT NULL DEFAULT false,
  
  -- Column behavior
  is_primary_key BOOLEAN NOT NULL DEFAULT false,
  is_nullable BOOLEAN NOT NULL DEFAULT true,
  is_unique BOOLEAN NOT NULL DEFAULT false,
  is_indexed BOOLEAN NOT NULL DEFAULT false,
  
  -- Validation
  is_required BOOLEAN NOT NULL DEFAULT false,
  default_value TEXT,
  validation_rules JSONB,
  
  -- Filtering
  is_filterable BOOLEAN NOT NULL DEFAULT false,
  filter_operators TEXT[],
  
  -- Foreign key relationship
  is_foreign_key BOOLEAN NOT NULL DEFAULT false,
  ref_schema VARCHAR(63),
  ref_table VARCHAR(63),
  ref_column VARCHAR(63),
  ref_display_column VARCHAR(63),
  on_delete VARCHAR(20),
  on_update VARCHAR(20),
  
  -- UI rendering
  input_type VARCHAR(50) DEFAULT 'text',
  select_options JSONB,
  conditional_rules JSONB,
  
  -- Advanced features
  is_searchable BOOLEAN NOT NULL DEFAULT false,
  is_sortable BOOLEAN NOT NULL DEFAULT true,
  is_file_upload BOOLEAN NOT NULL DEFAULT false,
  file_upload_config JSONB,
  
  -- Swagger documentation
  swagger_example TEXT,
  swagger_hidden BOOLEAN NOT NULL DEFAULT false,
  
  -- Column ordering and grouping
  display_order INT NOT NULL DEFAULT 0,
  form_group VARCHAR(100),
  
  -- Metadata tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT column_metadata_table_column_uk UNIQUE (table_id, column_name),
  CONSTRAINT column_metadata_fk_ck CHECK (
    (is_foreign_key = false AND ref_schema IS NULL AND ref_table IS NULL AND ref_column IS NULL) OR
    (is_foreign_key = true AND ref_schema IS NOT NULL AND ref_table IS NOT NULL AND ref_column IS NOT NULL)
  ),
  CONSTRAINT column_metadata_on_delete_ck CHECK (
    on_delete IS NULL OR 
    on_delete IN ('CASCADE', 'SET NULL', 'SET DEFAULT', 'RESTRICT', 'NO ACTION')
  ),
  CONSTRAINT column_metadata_on_update_ck CHECK (
    on_update IS NULL OR 
    on_update IN ('CASCADE', 'SET NULL', 'SET DEFAULT', 'RESTRICT', 'NO ACTION')
  ),
  CONSTRAINT column_metadata_input_type_ck CHECK (
    input_type IN (
      'text', 'textarea', 'number', 'email', 'password', 'url', 'tel',
      'date', 'datetime', 'time', 'select', 'multiselect', 'radio', 'checkbox',
      'file', 'image', 'color', 'range', 'json', 'wysiwyg'
    )
  ),
  CONSTRAINT column_metadata_file_upload_ck CHECK (
    (is_file_upload = false AND file_upload_config IS NULL) OR
    (is_file_upload = true AND file_upload_config IS NOT NULL)
  )
);

-- Indexes for column_metadata
CREATE INDEX IF NOT EXISTS idx_column_metadata_table_id ON meta.column_metadata(table_id);
CREATE INDEX IF NOT EXISTS idx_column_metadata_column_name ON meta.column_metadata(table_id, column_name);
CREATE INDEX IF NOT EXISTS idx_column_metadata_is_active ON meta.column_metadata(is_active);
CREATE INDEX IF NOT EXISTS idx_column_metadata_display_order ON meta.column_metadata(table_id, display_order);
CREATE INDEX IF NOT EXISTS idx_column_metadata_foreign_key ON meta.column_metadata(is_foreign_key, ref_schema, ref_table);

-- Comments
COMMENT ON TABLE meta.column_metadata IS 'Column-level metadata for validation, display, and behavior configuration';
COMMENT ON COLUMN meta.column_metadata.validation_rules IS 'JSON with class-validator rules: minLength, maxLength, pattern, min, max, etc.';
COMMENT ON COLUMN meta.column_metadata.filter_operators IS 'Allowed operators: _eq, _ne, _gt, _lt, _gte, _lte, _like, _in, _nin, _between, _null, _nnull';
COMMENT ON COLUMN meta.column_metadata.file_upload_config IS 'File upload settings: maxSize, allowedTypes, storage (s3/gcs/azure), path';
COMMENT ON COLUMN meta.column_metadata.conditional_rules IS 'UI conditional logic: show/hide based on other field values';

-- ==============================================================================
-- Table: meta.generated_files
-- ==============================================================================
-- Tracks generated files for regeneration and custom code preservation

CREATE TABLE IF NOT EXISTS meta.generated_files (
  id UUID PRIMARY KEY DEFAULT meta.uuid_generate_v7(),
  
  -- File identification
  table_id UUID NOT NULL REFERENCES meta.table_metadata(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  
  -- Change detection
  checksum VARCHAR(64) NOT NULL,
  metadata_checksum VARCHAR(64) NOT NULL,
  
  -- Status tracking
  has_custom_code BOOLEAN NOT NULL DEFAULT false,
  last_generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT generated_files_file_path_uk UNIQUE (file_path),
  CONSTRAINT generated_files_file_type_ck CHECK (
    file_type IN (
      'dto', 'entity', 'repository', 'service', 'controller', 
      'module', 'query', 'filter', 'guard', 'decorator', 'interface'
    )
  )
);

-- Indexes for generated_files
CREATE INDEX IF NOT EXISTS idx_generated_files_table_id ON meta.generated_files(table_id);
CREATE INDEX IF NOT EXISTS idx_generated_files_file_type ON meta.generated_files(file_type);
CREATE INDEX IF NOT EXISTS idx_generated_files_checksum ON meta.generated_files(checksum);
CREATE INDEX IF NOT EXISTS idx_generated_files_has_custom_code ON meta.generated_files(has_custom_code);
CREATE INDEX IF NOT EXISTS idx_generated_files_last_generated ON meta.generated_files(last_generated_at);

-- Comments
COMMENT ON TABLE meta.generated_files IS 'Tracks all generated files for change detection and regeneration';
COMMENT ON COLUMN meta.generated_files.checksum IS 'SHA-256 hash of current file content';
COMMENT ON COLUMN meta.generated_files.metadata_checksum IS 'SHA-256 hash of metadata used to generate file';
COMMENT ON COLUMN meta.generated_files.has_custom_code IS 'True if file contains custom code blocks (CUSTOM_CODE_START markers)';

-- ==============================================================================
-- Update Triggers
-- ==============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION meta.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_table_metadata_updated_at
  BEFORE UPDATE ON meta.table_metadata
  FOR EACH ROW
  EXECUTE FUNCTION meta.update_updated_at_column();

CREATE TRIGGER trigger_column_metadata_updated_at
  BEFORE UPDATE ON meta.column_metadata
  FOR EACH ROW
  EXECUTE FUNCTION meta.update_updated_at_column();

CREATE TRIGGER trigger_generated_files_updated_at
  BEFORE UPDATE ON meta.generated_files
  FOR EACH ROW
  EXECUTE FUNCTION meta.update_updated_at_column();

-- ==============================================================================
-- Sample Data (Optional - for testing)
-- ==============================================================================

-- Example: users table metadata
-- Uncomment to insert sample metadata

-- INSERT INTO meta.table_metadata (
--   schema_name, table_name, display_name, description,
--   module_name, entity_name, icon, color,
--   table_type, has_soft_delete, enable_export, enable_recap
-- ) VALUES (
--   'public', 'users', 'Users', 'System users management',
--   'users', 'User', 'user', 'blue',
--   'master', true, true, false
-- );

-- ==============================================================================
-- Grants (Adjust based on your database role setup)
-- ==============================================================================

-- GRANT USAGE ON SCHEMA meta TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA meta TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA meta TO your_app_user;

-- ==============================================================================
-- End of PostgreSQL Schema
-- ==============================================================================
