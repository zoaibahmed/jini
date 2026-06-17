# JNI Solutions — Driver Support SaaS & Operations Platform

JNI Solutions is a production-grade, highly scalable, AI-powered enterprise driver support SaaS platform designed specifically for TLC, Uber, Lyft, and commercial drivers in New York City (NYC). The platform automates driver compliance (TLC/DMV inspections, drug screenings, course updates), ticket disputes, SaaS billing subscription layers, and AI-powered telephone call centers.

---

## ⚡ Platform Architecture & Technology Stack

The platform is designed around a modern, decoupled client-server architecture built to support real-time high-throughput traffic with maximum resilience:

- **Frontend**: Next.js 15 App Router (React 19, TypeScript), Vanilla CSS with HSL variables, Lucide React icons, Framer Motion transitions, and Recharts.
- **Backend API & WebSockets**: NestJS 11 (Node.js 20, TypeScript), Prisma ORM, Socket.io (WebSockets Gateway), and BullMQ (Redis-backed task queueing).
- **Databases**: PostgreSQL (Relational Database) and Redis (Distributed Cache, Rate Limits, and Job Queue Store).
- **Telephony & Speech**: Twilio Voice (TwiML and Media Streams), OpenAI GPT-4o API (Multilingual conversational routing, intent categorization, and auto-ticketing), ElevenLabs (Natural Text-to-Speech), and Amazon Polly (Fallback Voice).
- **Infrastructure (AWS & Kubernetes)**: AWS EKS (Kubernetes cluster), Elastic Container Registry (ECR), RDS PostgreSQL, ElastiCache Redis, S3 (Document Vault), CloudFront CDN (Asset Delivery), Route53 (DNS routing), ACM (SSL/TLS Certificates), and AWS WAFv2 (Web Application Firewall protection).
- **Monitoring & CI/CD**: Prometheus (metrics scraping), Grafana (observability dashboard panels), and GitHub Actions (testing, Docker compilation, and deployment pipelines).

---

## 📂 Project Directory Structure

```text
jini/
├── frontend/                   # Next.js 15 App Router Frontend
│   ├── src/app/                # Next.js App routing tree
│   │   ├── dashboard/          # Multi-Role Dashboard Shell
│   │   │   ├── billing/        # Driver SaaS membership & Stripe invoice views
│   │   │   ├── compliance/     # License points and Woodside safety checklists
│   │   │   ├── copilot/        # Dedicated AI chat window & prompt analysis
│   │   │   ├── documents/      # S3 vault files view & upload zone
│   │   │   ├── earnings/       # Driver shift logs & Schedule C tax calculators
│   │   │   ├── notifications/  # Real-time alert notifications logs
│   │   │   ├── optimizer/      # Airport flight volume surge radar
│   │   │   ├── renewals/       # Expiration monitors and course schedules
│   │   │   ├── settings/       # Profile management and preferred language configs
│   │   │   ├── support/        # WebSockets driver ticket chats
│   │   │   ├── voice/          # Telephony live call control center (Staff Only)
│   │   │   ├── layout.tsx      # Sidebar links shell & WebSocket floating co-pilot widget
│   │   │   └── page.tsx        # Dashboard entrypoint (Driver overview vs Admin portal)
│   │   ├── theme-provider.tsx  # Incognito-safe dark/light theme provider
│   │   └── page.tsx            # Guest marketing landing page
│   ├── components/             # Global React components
│   │   └── CameraScanner.tsx   # Mobile camera scanner with automatic cropping
│   ├── components/ui/          # Reusable design components (buttons, toast, logs)
│   ├── hooks/useAuth.tsx       # Secure Auth context with silent refresh
│   └── Dockerfile              # Production Next.js Docker build
│
├── backend/                    # NestJS API & WebSocket Backend
│   ├── src/                    # API source code
│   │   ├── admin/              # User directories, system audit logs, & banners
│   │   ├── airport/            # Live flight volume arrivals API
│   │   ├── auth/               # JWT signin, signup, silent refresh, & 6-digit resets
│   │   ├── billing/            # SaaS checkout, plans manager, & Stripe webhooks
│   │   ├── copilot/            # OpenAI gpt integration, RAG vector FAQs, & token metrics
│   │   ├── document/           # Pre-signed S3 URL allocation & OCR compliance parsers
│   │   ├── driver/             # Profiles lookup & checklist status updates
│   │   ├── earnings/           # Shifts log database & expense categorizations
│   │   ├── support/            # Live chat gateways & ticket CRUD
│   │   ├── voice/              # Twilio callback webhooks & call analytics
│   │   ├── workers/            # BullMQ queue managers & job processors
│   │   ├── prisma/             # NestJS Prisma ORM service wrapper
│   │   ├── app.module.ts       # Main dependency injection assembly
│   │   └── main.ts             # Swagger bootstrap & CORS configuration
│   ├── prisma/                 # Relational schemas & seed scripts
│   │   ├── schema.prisma       # PostgreSQL schema declarations
│   │   └── seed.ts             # Database initial data seeds
│   └── Dockerfile              # NestJS production container build
│
├── infrastructure/             # EKS Kubernetes & DevOps Manifests
│   ├── k8s/                    # Deployments, StatefulSets, HPAs, and TLS Ingress
│   ├── monitoring/             # Prometheus config & Grafana dashboards
│   ├── db/                     # PgBouncer guides & db backup scripts
│   └── docs/                   # Deployment guides and environment guides
│
└── docker-compose.yml          # Local development PostgreSQL and Redis
```

---

## 💻 Portal Dashboards & Page Features

The application operates under a granular Role-Based Access Control (RBAC) engine matching user roles (`DRIVER`, `SUPPORT`, `ADMIN`, `SUPERADMIN`). 

### 1. Driver Dashboard (`DRIVER` Role)

Drivers see a client-facing suite of tools optimized to keep them compliant, increase their hourly yields, scan documents, and track business financial health.

#### 1.1 Welcome Banner & Profile Summary
- **Responsible Component**: `frontend/src/app/dashboard/page.tsx`
- **Features**: 
  - Welcomes the driver with their active name (e.g. `Test Driver`).
  - Displays linked vehicle information (e.g., `Toyota Camry Hybrid` with plate `T800TLC`) queried from the database.
  - Indicates the active language settings (e.g., `English, Spanish`) and profile completion flags.

#### 1.2 Compliance Shield (Timeline Checklist)
- **Responsible Component**: `frontend/src/app/dashboard/compliance/page.tsx`
- **Features**:
  - **Days-Left Timeline Counter**: Connects to `/driver/compliance` to fetch active requirements. Displays days-left warning meters with corresponding color indicators (Green for safe, Yellow for warnings under 30 days, Red for expired items).
  - **Compliance Items**:
    1. *TLC Vehicle Inspection (DMV)*: Tracks the tri-annual Woodside safety inspection.
    2. *Annual TLC Drug Screening*: Tracks the yearly drug test requirement.
    3. *Defensive Driving Certification Renewal*: Tracks the 6-hour online renewal course status.
    4. *TLC License Renewal Upload*: Checks that renewed physical license copies are processed.
  - **Violation Point Trackers**: Integrates simulated gauges displaying NY DMV License Points (11 points max) and NYC TLC License Points (6 points max). Suspensions trigger automatically if thresholds are breached.

#### 1.3 Active Shift Optimizer
- **Responsible Component**: `frontend/src/app/dashboard/page.tsx` (overview panel)
- **Features**:
  - **Start Shift Logger**: Allows drivers to trigger an active shift log session. A background timer polls every 3 seconds, increments simulated shift hours (+0.1 hr), and applies a variable earnings rate (+$3.15 per interval).
  - **Log Hours & Trips**: Drivers can write specific shift records to the backend (hours driven, platform logged [Uber, Lyft, TLC, Other], and number of trips completed).
  - **Expense Tracking**: Allows drivers to log vehicle gas fuel stops, tolls, and maintenance services.
  - **Tax Write-off Estimator**: Calculates net business profits (Gross Earnings - Expenses) and computes an estimated tax savings value based on a standard 22% marginal tax bracket deduction.

#### 1.4 Airport Surge Radar
- **Responsible Component**: `frontend/src/app/dashboard/optimizer/page.tsx`
- **Features**:
  - **Surge Multipliers**: Connects to the `/airport/arrivals` endpoint. Displays real-time airport arrival surge multipliers (e.g., JFK at `4.6x`, LGA at `3.2x`, EWR at `2.1x`).
  - **Expected Flights**: Shows count predictions for incoming landing flights over the next 3 hours.
  - **Traffic Level & Status**: Highlights traffic congestion metrics (`Heavy`, `Moderate`, `Low`) and provides custom flight wave arrival advice.
  - **Surge Filters**: Filters out low-yield airports, displaying only high-yield zones (Surge >= 3.0x).

#### 1.5 Secure Document Vault & Mobile Camera Scanner
- **Responsible Component**: `frontend/src/app/dashboard/documents/page.tsx` and `frontend/src/components/CameraScanner.tsx`
- **Features**:
  - **AWS S3 Encrypted Uploads**: Features a drag-and-drop file upload target. On file selection, it contacts `/documents/presigned-url` to request a secure AWS pre-signed upload URL, uploads the raw binary file directly to S3, and registers the file metadata in PostgreSQL.
  - **Mobile Camera Document Scanner**: Displays a "Scan Document with Camera" option. On mobile viewports, this launches a fullscreen camera overlay (`navigator.mediaDevices.getUserMedia`) featuring:
    - Pulsing green edge indicators and a scanning laser line overlay.
    - Automatic canvas-based cropping that takes only the document portion inside the highlighted box.
    - Conversion of cropped canvas frames directly to JPEG blobs, sending them to the backend upload pipelines.
    - A fallback canvas generator that outputs simulated test seals for testing on desktops or environments lacking camera inputs.

#### 1.6 SaaS Billing & Subscriptions
- **Responsible Component**: `frontend/src/app/dashboard/billing/page.tsx`
- **Features**:
  - **Membership Status**: Displays current subscription states (Active, Trial, Cancelled) and active periods. It shows a progress bar tracking days remaining until renewal.
  - **Membership Plan Tiers**:
    1. *Basic Support ($0/mo)*: Access to Document Vault.
    2. *Premium Driver Pro ($19/mo)*: Access to Vault, AI Driver Co-pilot, and Support ticket disputing.
    3. *Enterprise Fleet ($99/mo)*: Access to all features, including Fleet Dispatcher options.
  - **Stripe Checkout Redirects**: Integrates with `/billing/checkout` to generate Stripe Checkout sessions (simulated via backend route), redirecting clients to select plans. On success, it processes the callback URL parameters to sync transaction records.

#### 1.7 Support Disputes Center
- **Responsible Component**: `frontend/src/app/dashboard/support/page.tsx`
- **Features**:
  - **Summons Ticket Form**: Form to submit TLC/DMV traffic summons disputes. Drivers input titles, categories (TLC, DMV, INSURANCE, etc.), priorities (LOW, MEDIUM, HIGH, URGENT), descriptions, and attach files.
  - **WebSocket Live Chat Room**: Connects to the `/support` namespace on the Socket.io gateway. Enables immediate text chatting with active support agents.
  - **Typing Status Indicator**: Automatically broadcasts a typing notification to the socket room when a user inputs text, rendering a `User typing...` overlay for the other party.

#### 1.8 AI Co-pilot Floating Assistant Widget
- **Responsible Component**: `frontend/src/app/dashboard/layout.tsx`
- **Features**:
  - **Namespace Websocket Stream**: Renders a floating chat bubble at the bottom right. Connects to `/copilot` on the WebSocket server.
  - **Token Typewriter Stream**: Receives tokens chunk-by-chunk from the backend (`streamStart`, `streamToken`, `receiveMessage`) to animate AI text responses smoothly.

---

### 2. JNI Operations Center (`SUPPORT`, `ADMIN`, `SUPERADMIN` Roles)

Staff and administrators utilize a centralized management console to resolve tickets, review voice recordings, adjust AI system directives, and monitor payments.

#### 2.1 Operations Dashboard Overview
- **Responsible Component**: `frontend/src/app/dashboard/page.tsx` (admin tabs)
- **Features**:
  - Displays platform-wide key performance indicators (KPIs): Total Active Drivers, Pending Vault Uploads, Monthly Recurring Revenue (MRR), Open Support Tickets, and Live Telephone Calls.

#### 2.2 Drivers & Staff Directory
- **Responsible Component**: `frontend/src/app/dashboard/page.tsx`
- **Features**:
  - **Search & Filters**: Lists all registered accounts in the system with search queries, role filtering (`DRIVER`, `SUPPORT`, `ADMIN`, `SUPERADMIN`), and status filters.
  - **Status Override**: Admins can suspend or activate any account instantly.
  - **Role Alterations**: Admins can promote/demote users (e.g. Driver to Support).
  - **Credential Reset**: Form override allowing administrators to force-reset any driver's login password.
  - **Drilldown Profile Inspector Modal**: A slide-out panel that displays a comprehensive view of a driver's profile: linked vehicles, active compliance tasks, uploaded documents, AI chat logs, and past payment logs.

#### 2.3 SaaS Billing & Promo Configurator
- **Responsible Component**: `frontend/src/app/dashboard/page.tsx` (payments tab)
- **Features**:
  - **Active Plans CRUD**: Displays plan configurations, pricing, and active driver counts.
  - **Coupon Creator**: Allows admins to generate new discount promo codes, setting discount percentages or flat amounts, and expiration dates.
  - **Payment History Ledger**: Tracks every payment transaction, detailing billing date, invoice ID, driver name, amount paid, and Stripe status.

#### 2.4 Support Queue Action Console
- **Responsible Component**: `frontend/src/app/dashboard/support/page.tsx` (agent view)
- **Features**:
  - **Ticket Queue**: Lists active support requests with priority and category filters.
  - **Agent Assignment**: Support agents can assign tickets to themselves or delegate them to other staff members.
  - **Status Management**: Toggles ticket statuses (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_USER`, `RESOLVED`, `CLOSED`, `ESCALATED`).
  - **Private Notes**: Agents can write internal private logs (invisible to drivers) to document progress.
  - **Escalation Panel**: Allows agents to escalate tickets to a Super Admin, logging specific escalation rationales.

#### 2.5 Voice Call Center Dashboard
- **Responsible Component**: `frontend/src/app/dashboard/voice/page.tsx`
- **Features**:
  - **Live Call Queue**: Displays active calls handled by the Twilio voice system. Shows caller phone numbers, active status timings, detected intents (e.g., `TLC_RENEWAL`), and caller languages.
  - **Manual Agent Transfer**: Features a transfer button to routing calls dynamically.
  - **Call Logs Registry**: Tabulates historical calls. Features language/intent filters and a button to export data to a CSV spreadsheet.
  - **Voice Analytics**: Visualizes total call counts, average durations, resolution rates, caller intent spreads, and language breakdowns using Recharts.

#### 2.6 AI Prompt Monitor Console
- **Responsible Component**: `frontend/src/app/dashboard/page.tsx` (AI tab)
- **Features**:
  - **System Prompt Editor**: Renders an editor to view, edit, and update the system prompt directives that guide the AI Co-pilot and Telephony systems.
  - **FAQ Knowledge Base CRUD**: Allows admins to add, edit, or delete FAQ articles, which are automatically indexed and injected as context (RAG) during AI operations.
  - **Token Analytics**: Real-time stats dashboard displaying total AI calls, total prompt tokens, completion tokens, latency performance, and estimated API costs in USD.

---

## 🔔 Document Expiry & Renewals Notification Flow

The platform incorporates an automated document expiry and compliance checking workflow designed to prevent drivers from operating with invalid/expired credentials.

### 1. Document Parsing & OCR Extraction
When a driver uploads a document to the vault (either through standard upload or the mobile scanner), the system runs the following process:
1. The backend triggers the `complianceService.processDocumentFromFile()` task.
2. The OCR parses text data using **OpenAI GPT-4o Vision** (or falls back to a regex parser utilizing local Tesseract.js if API credentials are not set).
3. If the document type is confidently identified (e.g. as a `TLC License` or `Drug Test`), the backend:
   - Updates the S3 document's metadata with the parsed classification category.
   - Extracts the exact `expiryDate` and sets it in the document metadata database registry.
   - Creates a pending record under the driver's `ComplianceCheck` database table.

### 2. Automatic Notification Scheduling
1. Once the expiration date is set on the document, the system calculates a warning threshold:
   - **Trigger Date:** **30 days prior** to the document's expiration date.
2. The compliance engine registers a delayed queue job with **BullMQ** on the `reminders` queue.
3. The job's delayed execution timer is set as:
   $$\text{Delay} = \text{Date(Expiry)} - 30\text{ days} - \text{Date(Now)}$$
4. If this calculated date has already passed or is very near, the system triggers the alert immediately.

### 3. Contact Resolution & Alert Dispatch
When the BullMQ worker picks up a scheduled reminder job:
1. It queries `reminder.service.ts` to execute the dispatch.
2. **Dynamic Contact Resolution:** If only the `userId` is present on the job, the service automatically performs a PostgreSQL database query to lookup the driver's registered account:
   - Resolves their primary **Email address**.
   - Resolves their primary **Phone number**.
3. **Multi-Channel Delivery:**
   - **SMTP Email:** Triggers `emailService.sendRenewalReminder()`, which sends a detailed notification to the driver's inbox.
   - **WhatsApp/SMS Alert:** Triggers `whatsappService.sendWhatsAppMessage()`, sending a real-time notification to the driver's phone with instructions on how to renew the document.
   - **Dashboard Notification:** Emits a real-time `notification` event over the socket gateway, populating the driver's dashboard notification center with a warning card.

---

## 🔒 Security & Failsafes

- **User-Friendly 6-Digit Password Reset:** Replaced the long alphanumeric reset tokens with a **6-digit numeric code**. This is sent via email, allowing users to easily read and input the code to reset their password on the same page.
- **Collapsed Responsive Sidebar on Mobile:** On mobile viewports, the bottom navigation bar is replaced by a slim 56px (w-14) icon-only sidebar docked on the left. Hovering or tapping expands it smoothly to full-width (256px), showing names, profile details, theme switcher, and sign-out controls.
- **Incognito Browser Security**: Next.js theme controls and auth JWT caching intercept local storage blocks, ensuring mobile browsers (e.g., Safari, Chrome Incognito) do not crash when accessing preferences.
- **Redis Resilience**: The database cache client catches connection delays and automatically switches queries to local memory, preventing system crashes during Redis outages.

---

## 🛠️ Local Development Setup

### Prerequisites
Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [Node.js v20+](https://nodejs.org/).

### Step 1: Start Relational Databases & Caching
```bash
docker-compose up -d
```

### Step 2: Configure & Launch NestJS Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure variables in your `backend/.env` file.
3. Install dependencies, generate schemas, and start the development server:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   npm run start:dev
   ```

### Step 3: Configure & Launch Next.js Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open `http://localhost:3000` in your browser.
