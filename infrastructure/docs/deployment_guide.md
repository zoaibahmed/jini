# Deployment & Infrastructure Installation Guide

This deployment guide walks through setting up the enterprise-grade production environment for JNI Solutions on **AWS (EKS, RDS, ElastiCache, S3, CloudFront)**.

## 1. Environment Variable Architecture Configuration

Create your production environment variables. Keep secrets isolated inside AWS Secrets Manager or KMS:

### ConfigMap Values (`jini-config`):
- `NODE_ENV`: `production`
- `PORT`: `5000`
- `REDIS_HOST`: `jini-prod-redis.xxxxxx.use1.cache.amazonaws.com` (AWS ElastiCache Redis endpoints)
- `REDIS_PORT`: `6379`
- `BACKEND_URL`: `https://api.jnisolutions.com`
- `CDN_URL`: `https://static.jnisolutions.com`

### Secret Values (`jini-secrets`):
- `DATABASE_URL`: `postgresql://jini_admin:PASSWORD@rds-endpoint:5432/jini_prod_db?sslmode=require`
- `JWT_SECRET`: Generate using `openssl rand -base64 32`
- `SMTP_PASS`: SMTP credentials token
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`
- `ELEVENLABS_API_KEY`
- `OPENAI_API_KEY`

---

## 2. Setting Up AWS Resources

### AWS S3 Storage Folders:
Create a private S3 bucket `jini-solutions-vault` with the following partition folders:
- `/documents` (PDF compliance docs)
- `/avatars` (Driver profile images)
- `/uploads` (OCR temporary files)
- `/voice` (Telephony call audio clips)
- `/exports` (Logs and billing CSV dumps)
- `/logs` (S3 access logs)

### CDN Configuration (CloudFront):
1. Create a CloudFront distribution pointing to S3 bucket as Origin.
2. Restrict bucket access using Origin Access Control (OAC) to force all client asset requests to cache at edge endpoints.
3. Bind ACM Certificate to distribution. Add Route53 CNAME record pointing `static.jnisolutions.com` to the CloudFront domain.

---

## 3. Kubernetes Deployment Guide

To deploy the manifests on your EKS cluster:

### Step 1: Initialize namespaces and secrets
```bash
kubectl create namespace jini-prod

# Bind DB password & jwt secrets
kubectl create secret generic jini-secrets \
  --from-literal=DATABASE_URL="postgresql://jini_admin:PASSWORD@rds:5432/jini_prod_db" \
  --from-literal=JWT_SECRET="YOUR_JWT_SECRET" \
  -n jini-prod
```

### Step 2: Apply database replicas StatefulSets
```bash
kubectl apply -f infrastructure/k8s/db-replica-service.yaml
```

### Step 3: Deploy backend, workers, and frontend pods
```bash
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f infrastructure/k8s/worker-deployment.yaml
```

### Step 4: Apply HPAs and Ingress Routing
```bash
kubectl apply -f infrastructure/k8s/hpa-backend.yaml
kubectl apply -f infrastructure/k8s/ingress-tls-waf.yaml
```
Verify ingress endpoints address output mapping using `kubectl get ingress -n jini-prod`.
