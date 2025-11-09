-- ==============================================================================
-- NestJS Generator Metadata Schema - MySQL
-- ==============================================================================
-- This schema stores metadata for automatic CRUD module generation.
-- Tables: meta.table_metadata, meta.column_metadata, meta.generated_files
-- Requires: MySQL 8.0+ for JSON functions and CHECK constraints
-- ==============================================================================

-- Create database for metadata (if not using existing database)
-- CREATE DATABASE IF NOT EXISTS nest_generator_meta DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE nest_generator_meta;

-- Note: MySQL doesn't have schema concept like PostgreSQL, we'll use table prefixes instead
-- Prefix: meta_table_metadata, meta_column_metadata, meta_generated_files

-- ==============================================================================
-- UUID v7 Helper Function (MySQL version)
-- ==============================================================================
-- MySQL doesn't support custom UUID generation easily, so we'll use CHAR(36) for UUIDs
-- and generate them in application layer. This is a placeholder for consistency.

DELIMITER $$

CREATE FUNCTION IF NOT EXISTS uuid_generate_v7()
RETURNS CHAR(36)
DETERMINISTIC
BEGIN
  -- MySQL 8.0+ has UUID() but it's v1, not v7
  -- For v7, we'll generate in application layer and just validate format here
  -- This function serves as documentation/placeholder
  RETURN UUID();
END$$

DELIMITER ;

-- ==============================================================================
-- Table: meta_table_metadata
-- ==============================================================================
-- Stores metadata configuration for each table to be generated as CRUD module

CREATE TABLE IF NOT EXISTS meta_table_metadata (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
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
  
  -- Permissions (JSON stored as TEXT in MySQL < 5.7.8, JSON type in MySQL >= 5.7.8)
  permission_config JSON,
  
  -- Metadata tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Constraints
  CONSTRAINT table_metadata_schema_table_uk UNIQUE (schema_name, table_name),
  CONSTRAINT table_metadata_module_uk UNIQUE (module_name),
  CONSTRAINT table_metadata_table_type_ck CHECK (table_type IN ('master', 'transaction', 'reference', 'junction')),
  CONSTRAINT table_metadata_partition_type_ck CHECK (
    partition_type IS NULL OR 
    partition_type IN ('range', 'list', 'hash')
  ),
  CONSTRAINT table_metadata_partition_key_ck CHECK (
    (is_partitioned = 0 AND partition_type IS NULL AND partition_key IS NULL) OR
    (is_partitioned = 1 AND partition_type IS NOT NULL AND partition_key IS NOT NULL)
  ),
  CONSTRAINT table_metadata_cache_ttl_ck CHECK (
    (cache_enabled = 0 AND cache_ttl IS NULL) OR
    (cache_enabled = 1 AND cache_ttl > 0)
  ),
  CONSTRAINT table_metadata_throttle_ck CHECK (
    (throttle_enabled = 0) OR
    (throttle_enabled = 1 AND throttle_limit > 0 AND throttle_ttl > 0)
  ),
  CONSTRAINT table_metadata_page_size_ck CHECK (
    default_page_size > 0 AND 
    max_page_size >= default_page_size
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for meta_table_metadata
CREATE INDEX idx_table_metadata_schema_table ON meta_table_metadata(schema_name, table_name);
CREATE INDEX idx_table_metadata_module ON meta_table_metadata(module_name, is_active);
CREATE INDEX idx_table_metadata_is_active ON meta_table_metadata(is_active);
CREATE INDEX idx_table_metadata_created_at ON meta_table_metadata(created_at);

-- Comments (MySQL 8.0+ supports column comments)
ALTER TABLE meta_table_metadata COMMENT = 'Configuration metadata for automatic CRUD module generation';

-- ==============================================================================
-- Table: meta_column_metadata
-- ==============================================================================
-- Stores metadata for each column including validation, display, and behavior

CREATE TABLE IF NOT EXISTS meta_column_metadata (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Column identification
  table_id CHAR(36) NOT NULL,
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
  validation_rules JSON,
  
  -- Filtering
  is_filterable BOOLEAN NOT NULL DEFAULT false,
  filter_operators JSON, -- Array stored as JSON
  
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
  select_options JSON,
  conditional_rules JSON,
  
  -- Advanced features
  is_searchable BOOLEAN NOT NULL DEFAULT false,
  is_sortable BOOLEAN NOT NULL DEFAULT true,
  is_file_upload BOOLEAN NOT NULL DEFAULT false,
  file_upload_config JSON,
  
  -- Swagger documentation
  swagger_example TEXT,
  swagger_hidden BOOLEAN NOT NULL DEFAULT false,
  
  -- Column ordering and grouping
  display_order INT NOT NULL DEFAULT 0,
  form_group VARCHAR(100),
  
  -- Metadata tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  created_by CHAR(36),
  updated_by CHAR(36),
  
  -- Constraints
  CONSTRAINT column_metadata_table_column_uk UNIQUE (table_id, column_name),
  CONSTRAINT column_metadata_table_fk FOREIGN KEY (table_id) 
    REFERENCES meta_table_metadata(id) ON DELETE CASCADE,
  CONSTRAINT column_metadata_fk_ck CHECK (
    (is_foreign_key = 0 AND ref_schema IS NULL AND ref_table IS NULL AND ref_column IS NULL) OR
    (is_foreign_key = 1 AND ref_schema IS NOT NULL AND ref_table IS NOT NULL AND ref_column IS NOT NULL)
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
    (is_file_upload = 0 AND file_upload_config IS NULL) OR
    (is_file_upload = 1 AND file_upload_config IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for meta_column_metadata
CREATE INDEX idx_column_metadata_table_id ON meta_column_metadata(table_id);
CREATE INDEX idx_column_metadata_column_name ON meta_column_metadata(table_id, column_name);
CREATE INDEX idx_column_metadata_is_active ON meta_column_metadata(is_active);
CREATE INDEX idx_column_metadata_display_order ON meta_column_metadata(table_id, display_order);
CREATE INDEX idx_column_metadata_foreign_key ON meta_column_metadata(is_foreign_key, ref_schema, ref_table);

-- Comments
ALTER TABLE meta_column_metadata COMMENT = 'Column-level metadata for validation, display, and behavior configuration';

-- ==============================================================================
-- Table: meta_generated_files
-- ==============================================================================
-- Tracks generated files for regeneration and custom code preservation

CREATE TABLE IF NOT EXISTS meta_generated_files (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- File identification
  table_id CHAR(36) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  
  -- Change detection
  checksum VARCHAR(64) NOT NULL,
  metadata_checksum VARCHAR(64) NOT NULL,
  
  -- Status tracking
  has_custom_code BOOLEAN NOT NULL DEFAULT false,
  last_generated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_modified_at TIMESTAMP(6),
  
  -- Metadata
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  
  -- Constraints
  CONSTRAINT generated_files_file_path_uk UNIQUE (file_path),
  CONSTRAINT generated_files_table_fk FOREIGN KEY (table_id) 
    REFERENCES meta_table_metadata(id) ON DELETE CASCADE,
  CONSTRAINT generated_files_file_type_ck CHECK (
    file_type IN (
      'dto', 'entity', 'repository', 'service', 'controller', 
      'module', 'query', 'filter', 'guard', 'decorator', 'interface'
    )
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for meta_generated_files
CREATE INDEX idx_generated_files_table_id ON meta_generated_files(table_id);
CREATE INDEX idx_generated_files_file_type ON meta_generated_files(file_type);
CREATE INDEX idx_generated_files_checksum ON meta_generated_files(checksum);
CREATE INDEX idx_generated_files_has_custom_code ON meta_generated_files(has_custom_code);
CREATE INDEX idx_generated_files_last_generated ON meta_generated_files(last_generated_at);

-- Comments
ALTER TABLE meta_generated_files COMMENT = 'Tracks all generated files for change detection and regeneration';

-- ==============================================================================
-- Sample Data (Optional - for testing)
-- ==============================================================================

-- Example: users table metadata
-- Uncomment to insert sample metadata

-- INSERT INTO meta_table_metadata (
--   id, schema_name, table_name, display_name, description,
--   module_name, entity_name, icon, color,
--   table_type, has_soft_delete, enable_export, enable_recap
-- ) VALUES (
--   UUID(), 'public', 'users', 'Users', 'System users management',
--   'users', 'User', 'user', 'blue',
--   'master', true, true, false
-- );

-- ==============================================================================
-- Grants (Adjust based on your database user setup)
-- ==============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON meta_table_metadata TO 'your_app_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON meta_column_metadata TO 'your_app_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON meta_generated_files TO 'your_app_user'@'%';

-- ==============================================================================
-- End of MySQL Schema
-- ==============================================================================
