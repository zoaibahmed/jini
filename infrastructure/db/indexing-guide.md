# PostgreSQL Production Database Architecture & Indexing Guide

For scaling JNI Solutions database layer from 5k stable users to lakhs of concurrent users, we configure PostgreSQL with the following production architecture:

## 1. Connection Pooling (PgBouncer)
Direct database connections are expensive in PostgreSQL. We deploy **PgBouncer** in transaction mode (`pool_mode = transaction`) between our NestJS backend and the Postgres cluster.

### Target Config:
- `max_client_conn = 10000` (allows lakhs of clients to bind concurrently)
- `default_pool_size = 50` (limits actual connections to database engine)

---

## 2. Production Indexing Strategy
We apply targeted composite and partial indexes to optimize analytical reads:

### Core Indexes:
```sql
-- Fast verification checkups & login
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_hash ON "User" USING HASH (email);

-- Paginated user lists
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_created ON "User" (role, "createdAt" DESC);

-- Document OCR searches & expiration alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_status_expiry ON "Document" (status, "expiryDate") WHERE status != 'SAFE';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_driver ON "Document" ("driverId");

-- Active calls queue lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_calls_active ON "VoiceCall" (status) WHERE status IN ('ACTIVE', 'RINGING');

-- Support tickets dashboard queue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_dashboard ON "Ticket" (status, priority, "createdAt" DESC);
```

---

## 3. Database Partitioning
When the `AIUsage` and `SystemEvent` audit ledgers grow past 50 million records (lakhs of users), we apply **Table Partitioning** by month on `createdAt` timestamp:

```sql
-- Creating partitioned table
CREATE TABLE "SystemEvent_Partitioned" (
    id UUID NOT NULL,
    source VARCHAR(255) NOT NULL,
    "eventType" VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id, "createdAt")
) PARTITION BY RANGE ("createdAt");

-- Sample Monthly Partitions
CREATE TABLE "SystemEvent_y2026m05" PARTITION OF "SystemEvent_Partitioned"
    FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');
```

---

## 4. Read Scaling & Replication
- **Write Node (Primary)**: Handles all transactions (`INSERT`, `UPDATE`, `DELETE`).
- **Read Nodes (StatefulSets)**: Stateful replica nodes running streaming replication. NestJS backend uses a separate database connection pool pointing to `jini-db-replica-service:5432` for all query operations (`GET` routes), achieving horizontal scale.
