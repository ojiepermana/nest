# Database Schema Recommendations

## 🎯 Common Business Scenarios

Pre-designed schemas for rapid development with nest-generator.

---

## 1. Multi-Tenancy (SaaS Applications)

### Schema: Organization-Based Isolation

```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_orgs_slug ON organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_orgs_status ON organizations(status) WHERE deleted_at IS NULL;

-- Tenant-scoped users
CREATE TABLE organization_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
  status VARCHAR(20) DEFAULT 'active',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,

  UNIQUE(organization_id, email)
);

CREATE INDEX idx_org_users_org ON organization_users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_users_email ON organization_users(email) WHERE deleted_at IS NULL;

-- Tenant-scoped data example
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES organization_users(id),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_projects_org ON projects(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_owner ON projects(owner_id) WHERE deleted_at IS NULL;

-- Row-level security (PostgreSQL)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_isolation ON projects
  USING (organization_id = current_setting('app.current_organization_id')::UUID);
```

### Metadata Configuration

```sql
INSERT INTO meta.table_metadata (
  schema_name, table_name, table_purpose,
  has_soft_delete, cache_enabled, cache_ttl,
  enable_swagger, enable_versioning, enable_rbac
) VALUES
  ('public', 'organizations', 'Multi-tenant organizations', true, true, 600, true, true, true),
  ('public', 'organization_users', 'Tenant-scoped users', true, true, 300, true, true, true),
  ('public', 'projects', 'Tenant-scoped projects', true, true, 180, true, true, true);

-- Add tenant context middleware requirement
INSERT INTO meta.enterprise_features (
  table_metadata_id, enable_tenant_isolation, tenant_column_name
) SELECT id, true, 'organization_id'
FROM meta.table_metadata
WHERE table_name IN ('organization_users', 'projects');
```

---

## 2. User Management with Advanced RBAC

### Schema: Role-Permission Matrix

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  email_verified_at TIMESTAMP,
  phone_verified_at TIMESTAMP,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  last_login_at TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;

-- Roles (hierarchical)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_role_id UUID REFERENCES roles(id),
  level INTEGER DEFAULT 0, -- hierarchy level
  is_system BOOLEAN DEFAULT false, -- cannot be deleted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_roles_slug ON roles(slug);
CREATE INDEX idx_roles_parent ON roles(parent_role_id);

-- Permissions
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- users:create, users:read, users:update, users:delete
  resource VARCHAR(100) NOT NULL, -- users, posts, comments
  action VARCHAR(50) NOT NULL, -- create, read, update, delete, approve
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_permissions_slug ON permissions(slug);
CREATE INDEX idx_permissions_resource ON permissions(resource);

-- Role-Permission mapping
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- User-Role mapping (many-to-many)
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- Direct user permissions (override role permissions)
CREATE TABLE user_permissions (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true, -- true=grant, false=revoke
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  PRIMARY KEY (user_id, permission_id)
);

-- Seed data
INSERT INTO roles (name, slug, level, is_system) VALUES
  ('Super Admin', 'super-admin', 100, true),
  ('Admin', 'admin', 50, true),
  ('Manager', 'manager', 30, true),
  ('User', 'user', 10, true),
  ('Guest', 'guest', 0, true);

INSERT INTO permissions (name, slug, resource, action) VALUES
  ('Create Users', 'users:create', 'users', 'create'),
  ('View Users', 'users:read', 'users', 'read'),
  ('Update Users', 'users:update', 'users', 'update'),
  ('Delete Users', 'users:delete', 'users', 'delete'),
  ('Manage Roles', 'roles:manage', 'roles', 'manage');
```

---

## 3. Audit Trail with Change Tracking

### Schema: Complete Audit System

```sql
-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),

  -- Context
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE

  -- Who & When
  user_id UUID,
  user_email VARCHAR(255),
  user_name VARCHAR(200),
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- What changed
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],

  -- Why (optional)
  reason TEXT,

  -- Tracing
  correlation_id UUID,
  request_id VARCHAR(100),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Partitioning by month (PostgreSQL 10+)
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_operation ON audit_logs(operation);

-- Field-level change tracking
CREATE TABLE field_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  audit_log_id UUID REFERENCES audit_logs(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  data_type VARCHAR(50),
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_field_changes_audit ON field_changes(audit_log_id);
CREATE INDEX idx_field_changes_field ON field_changes(field_name);

-- Audit retention policy
CREATE TABLE audit_retention_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  table_name VARCHAR(100) UNIQUE NOT NULL,
  retention_days INTEGER NOT NULL DEFAULT 365,
  archive_after_days INTEGER,
  archive_storage VARCHAR(50), -- s3, gcs, azure
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Auto-cleanup job (example)
CREATE OR REPLACE FUNCTION cleanup_old_audits()
RETURNS void AS $$
DECLARE
  policy RECORD;
BEGIN
  FOR policy IN SELECT * FROM audit_retention_policies LOOP
    DELETE FROM audit_logs
    WHERE table_name = policy.table_name
      AND created_at < NOW() - (policy.retention_days || ' days')::INTERVAL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### Trigger Auto-Generation

```sql
-- Example trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (
      table_name, record_id, operation,
      user_id, old_values, created_at
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      current_setting('app.current_user_id', true)::UUID,
      to_jsonb(OLD),
      NOW()
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (
      table_name, record_id, operation,
      user_id, old_values, new_values, created_at
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      current_setting('app.current_user_id', true)::UUID,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NOW()
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (
      table_name, record_id, operation,
      user_id, new_values, created_at
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'INSERT',
      current_setting('app.current_user_id', true)::UUID,
      to_jsonb(NEW),
      NOW()
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

---

## 4. Event Sourcing / Activity Streams

### Schema: Event Store Pattern

```sql
-- Events table (append-only)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),

  -- Event identity
  event_type VARCHAR(100) NOT NULL, -- user.created, order.placed, payment.processed
  aggregate_id UUID NOT NULL, -- entity ID
  aggregate_type VARCHAR(100) NOT NULL, -- User, Order, Payment

  -- Event data
  event_data JSONB NOT NULL,
  event_metadata JSONB DEFAULT '{}',

  -- Causality
  causation_id UUID, -- what caused this event
  correlation_id UUID, -- group related events

  -- Versioning
  version INTEGER NOT NULL, -- aggregate version

  -- Actor
  actor_id UUID,
  actor_type VARCHAR(50),

  -- Timestamp (immutable)
  occurred_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(aggregate_id, version)
);

CREATE INDEX idx_events_aggregate ON events(aggregate_id, version DESC);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_occurred ON events(occurred_at DESC);
CREATE INDEX idx_events_correlation ON events(correlation_id) WHERE correlation_id IS NOT NULL;

-- Snapshots (performance optimization)
CREATE TABLE aggregate_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  version INTEGER NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(aggregate_id, version)
);

CREATE INDEX idx_snapshots_aggregate ON aggregate_snapshots(aggregate_id, version DESC);

-- Projections (read models)
CREATE TABLE user_summary (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(200),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMP,
  last_event_version INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Event processing status
CREATE TABLE event_processors (
  id VARCHAR(100) PRIMARY KEY,
  last_processed_event_id UUID,
  last_processed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'running',
  error_message TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Time-Series Data (Metrics/Analytics)

### Schema: Optimized for TimescaleDB

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Metrics table
CREATE TABLE metrics (
  time TIMESTAMPTZ NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  value DOUBLE PRECISION NOT NULL,

  -- Dimensions
  user_id UUID,
  organization_id UUID,
  resource_type VARCHAR(50),
  resource_id UUID,

  -- Tags (for filtering)
  tags JSONB,

  -- Metadata
  unit VARCHAR(20), -- ms, bytes, count
  source VARCHAR(50)
);

-- Convert to hypertable (TimescaleDB)
SELECT create_hypertable('metrics', 'time');

-- Indexes
CREATE INDEX idx_metrics_name_time ON metrics(metric_name, time DESC);
CREATE INDEX idx_metrics_user ON metrics(user_id, time DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_metrics_org ON metrics(organization_id, time DESC) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_metrics_tags ON metrics USING GIN(tags);

-- Continuous aggregates (pre-computed rollups)
CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS hour,
  metric_name,
  organization_id,
  AVG(value) as avg_value,
  MAX(value) as max_value,
  MIN(value) as min_value,
  COUNT(*) as count
FROM metrics
GROUP BY hour, metric_name, organization_id;

-- Refresh policy (auto-update every 30 minutes)
SELECT add_continuous_aggregate_policy('metrics_hourly',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '30 minutes');

-- Retention policy (auto-delete old data)
SELECT add_retention_policy('metrics', INTERVAL '90 days');

-- Compression (save storage)
ALTER TABLE metrics SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'metric_name, organization_id'
);

SELECT add_compression_policy('metrics', INTERVAL '7 days');
```

---

## 6. File Management with Metadata

### Schema: Advanced File Storage

```sql
-- Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),

  -- Storage
  storage_provider VARCHAR(50) NOT NULL, -- local, s3, gcs, azure
  storage_path VARCHAR(500) NOT NULL,
  storage_bucket VARCHAR(200),

  -- File info
  original_name VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  checksum VARCHAR(64) NOT NULL, -- SHA-256

  -- Organization
  folder_id UUID REFERENCES folders(id),

  -- Access control
  owner_id UUID NOT NULL,
  organization_id UUID,
  visibility VARCHAR(20) DEFAULT 'private', -- public, private, shared

  -- Metadata
  width INTEGER, -- for images
  height INTEGER,
  duration INTEGER, -- for videos/audio (seconds)
  metadata JSONB DEFAULT '{}',

  -- Virus scanning
  scanned_at TIMESTAMP,
  is_safe BOOLEAN DEFAULT true,
  scan_result JSONB,

  -- Lifecycle
  expires_at TIMESTAMP,
  downloaded_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_files_owner ON files(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_org ON files(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_folder ON files(folder_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_checksum ON files(checksum);
CREATE INDEX idx_files_expires ON files(expires_at) WHERE expires_at IS NOT NULL;

-- Folders (hierarchical)
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  name VARCHAR(200) NOT NULL,
  parent_folder_id UUID REFERENCES folders(id),
  owner_id UUID NOT NULL,
  organization_id UUID,
  path VARCHAR(1000), -- materialized path: /folder1/folder2/folder3
  level INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_folders_parent ON folders(parent_folder_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_folders_path ON folders(path) WHERE deleted_at IS NULL;

-- File sharing
CREATE TABLE file_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  share_token VARCHAR(100) UNIQUE NOT NULL,

  -- Access control
  shared_by UUID NOT NULL,
  shared_with_user_id UUID,
  shared_with_email VARCHAR(255),

  -- Permissions
  can_download BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,

  -- Limits
  max_downloads INTEGER,
  download_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP,

  -- Tracking
  last_accessed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_file_shares_token ON file_shares(share_token);
CREATE INDEX idx_file_shares_file ON file_shares(file_id);
CREATE INDEX idx_file_shares_expires ON file_shares(expires_at) WHERE expires_at IS NOT NULL;

-- File versions (for version control)
CREATE TABLE file_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  size_bytes BIGINT NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  created_by UUID NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(file_id, version_number)
);

CREATE INDEX idx_file_versions_file ON file_versions(file_id, version_number DESC);
```

---

## 7. Notifications & Messaging

### Schema: Multi-Channel Notifications

```sql
-- Notification templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- email, sms, push, in-app
  subject VARCHAR(255),
  body_template TEXT NOT NULL, -- Handlebars template
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications queue
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),

  -- Target
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL, -- email, sms, push, in-app

  -- Content
  title VARCHAR(255),
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, read
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  failed_reason TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Priority
  priority INTEGER DEFAULT 0, -- 0=normal, 1=high, 2=urgent

  -- Grouping
  category VARCHAR(50),
  reference_type VARCHAR(50),
  reference_id UUID,

  -- Expiry
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_status_priority ON notifications(status, priority DESC);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_reference ON notifications(reference_type, reference_id);

-- User notification preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,

  -- Category preferences
  preferences JSONB DEFAULT '{
    "marketing": {"email": false, "push": false},
    "updates": {"email": true, "push": true},
    "security": {"email": true, "sms": true, "push": true}
  }',

  -- Quiet hours
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50),

  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery tracking
CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  provider VARCHAR(50), -- sendgrid, twilio, firebase
  provider_message_id VARCHAR(255),
  status VARCHAR(20) NOT NULL, -- delivered, bounced, failed
  delivered_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deliveries_notification ON notification_deliveries(notification_id);
```

---

## 🚀 Quick Generate Commands

```bash
# Multi-tenancy
nest-generator generate organizations --features.rbac=true --features.audit=true
nest-generator generate organization_users --features.rbac=true --features.tenant-scoped=true

# RBAC
nest-generator generate users --features.auth=true --features.rbac=true
nest-generator generate roles --features.rbac=true
nest-generator generate permissions --features.rbac=true

# Audit
nest-generator generate audit_logs --features.audit=true --features.readonly=true

# Events
nest-generator generate events --features.event-sourcing=true --features.readonly=true

# Files
nest-generator generate files --features.file-upload=true --features.rbac=true

# Notifications
nest-generator generate notifications --features.queue=true --features.realtime=true
```

---

**Next Steps**: Implement these schemas and run the generator to create production-ready modules.
