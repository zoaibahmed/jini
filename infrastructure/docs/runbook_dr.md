# Disaster Recovery & System Rollback Runbook

This runbook outlines the operational steps for emergency restores, deployments rollback, and disaster recovery processes.

## 1. Database Disaster Recovery & Restore

In the event of database corruption or primary cluster loss:

### Step 1: Download the target SQL backup from S3:
```bash
# List available backups on S3
aws s3 ls s3://jini-solutions-backups/database/

# Download the desired backup sql.gz file
aws s3 cp s3://jini-solutions-backups/database/jini_prod_db_backup_2026-05-26_12-00-00.sql.gz /tmp/restore.sql.gz
```

### Step 2: Decompress the backup:
```bash
gunzip /tmp/restore.sql.gz
```

### Step 3: Run target PostgreSQL restore commands:
Ensure the database schema has been cleaned or recreate the database:
```bash
# Drop & recreate db
psql -h rds-endpoint -U jini_admin -d postgres -c "DROP DATABASE jini_prod_db WITH (FORCE);"
psql -h rds-endpoint -U jini_admin -d postgres -c "CREATE DATABASE jini_prod_db;"

# Restore SQL backup
psql -h rds-endpoint -U jini_admin -d jini_prod_db -f /tmp/restore.sql
```

---

## 2. Kubernetes Rolling Deployment Rollback

If a bad deployment is pushed to EKS causing crashes, loop states, or latency spikes:

### Step 1: Check rollout history:
```bash
kubectl rollout history deployment/jini-backend -n jini-prod
```

### Step 2: Roll back immediately to the last stable revision:
```bash
kubectl rollout undo deployment/jini-backend -n jini-prod
kubectl rollout undo deployment/jini-worker -n jini-prod
kubectl rollout undo deployment/jini-frontend -n jini-prod
```
To roll back to a specific revision (e.g. revision 4):
```bash
kubectl rollout undo deployment/jini-backend --to-revision=4 -n jini-prod
```

### Step 3: Monitor pod status:
```bash
kubectl rollout status deployment/jini-backend -n jini-prod --timeout=120s
kubectl get pods -n jini-prod -w
```

---

## 3. High Availability Failover
- **Postgres Primary Node Failure**: AWS RDS Multi-AZ will automatically detect the failure and promote the standby replica in another Availability Zone. This updates DNS records within 60 seconds. Client connections automatically reconnect.
- **Worker Failure**: EKS node monitoring detects crash loop errors. EKS will automatically terminate failed worker pods and spin up new instances on active nodes.
- **Redis Cache Outage**: BullMQ workers and caching clients are configured with client auto-reconnect configurations. If Redis fails, background tasks are deferred to local memory, avoiding transaction drops.
