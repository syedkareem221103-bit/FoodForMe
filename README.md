# FoodForMe - Smart Restaurant Ordering System

FoodForMe is a high-fidelity, premium full-stack restaurant platform. Customers browse a localized digital menu, order by scanning unique QR codes at physical tables, and experience a real-time kitchen-to-table service loop. The system features a unified Kitchen KDS (Kitchen Display System), an interactive Waiter console, an automated billing checkout with monospaced thermal receipt mockups, and a premium visual Admin Analytics dashboard showcasing business insights.

---

## 🛠️ Technology Stack
* **Frontend**: React 19, React Router, Vite, Tailwind CSS, Lucide Icons, Context API
* **Backend**: Node.js, Express, JWT Security, Helmet, Express-Rate-Limit, CORS
* **Database**: MongoDB (Mongoose schemas for Users, Tables, FoodItems, Orders, and Bills)
* **Hosting**: Prepared for **Render** (Backend) and **Vercel** (Frontend)

---

## 🔒 Production Security Hardening
The application has been hardened with standard enterprise security protocols to prepare for public internet deployment:
1. **HTTP Headers Hardening**: Implemented `helmet` middleware to enforce secure response headers, preventing clickjacking, XSS, and sniff vulnerabilities.
2. **API Rate Limiting**: Deployed IP rate limiters via `express-rate-limit` to prevent brute force attacks:
   * **Authentication routes**: Restricted to 15 attempts per 15 minutes.
   * **General API endpoints**: Restricted to 100 requests per 15 minutes.
3. **CORS Origins Whitelist**: Dynamic whitelisting powered by the `ALLOWED_ORIGINS` environment variable, blocking unauthorized requests from third-party sites while permitting local development ports.
4. **Database Protection Triggers**: Seeding scripts contain automated safety locks that abort and exit immediately if run in `production` environments, avoiding accidental wipes.
5. **Secure SPA Rewrites**: Frontend is pre-configured with `vercel.json` rewrite routing guidelines to ensure client routes (like `/menu?table=3`) reload properly.

---

## 📂 Project Structure

```text
/Users/syednizam/My_proj_ect_FK/
├── backend/
│   ├── config/
│   │   ├── db.js          # Mongoose DB connection helper
│   │   └── seed.js        # DB seeding script (creates initial menu, tables, staff users)
│   ├── middleware/
│   │   ├── auth.js        # JWT protect & role authorize guards
│   │   └── error.js       # Centralized production-masked error handler
│   ├── models/
│   │   ├── User.js        # Staff user schema (Admin, Waiter, Kitchen)
│   │   ├── Table.js       # Dining table state schema
│   │   ├── FoodItem.js    # Restaurant menu items schema
│   │   ├── Order.js       # Customer order details and status schema
│   │   └── Bill.js        # Table checkout, subtotal, VAT, and payments schema
│   ├── routes/
│   │   ├── auth.js        # Login & registration endpoints
│   │   ├── menu.js        # Food item CRUD endpoints
│   │   ├── orders.js      # Customer order placement & KDS status endpoints
│   │   ├── tables.js      # Table status & bill checkouts endpoints
│   │   └── analytics.js   # Aggregated sales KPIs & SVG coordinates calculators
│   ├── .env.example       # Example file for backend configuration variables
│   ├── package.json       # Backend security dependencies configurations
│   └── server.js          # Hardened Express app entry point
│
└── frontend/
    ├── src/
    │   ├── context/       # AuthContext for session management
    │   ├── pages/         # Home, Menu, AdminLogin, AdminDashboard, WaiterDashboard, KitchenDashboard
    │   ├── App.jsx        # Routing configuration
    │   ├── index.css      # Core Tailwind styling & radial gradient glass mesh
    │   └── main.jsx       # DOM mounting entry
    ├── index.html         # Main HTML document with custom SEO tags
    ├── vercel.json        # Routing overrides for SPA reloads on Vercel
    ├── .env.example       # Example file for client configuration variables
    └── package.json       # React frontend dependencies configuration
```

---

## 🚀 Setup & Launch (Local Development)

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **MongoDB** running locally on port `27017`

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Copy the environment template and configure values:
   ```bash
   cp .env.example .env
   ```
3. Seed the database with default staff credentials, tables, and restaurant menu items:
   ```bash
   npm run seed
   ```
4. Launch the backend API server:
   ```bash
   npm run dev
   ```
   *The server runs locally on [http://localhost:5001](http://localhost:5001).*

### 3. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The browser client runs locally on [http://localhost:5173](http://localhost:5173).*

---

## ☁️ Production Deployment

For complete instructions on deploying the smart restaurant platform to production hosts, see our detailed handbook:

### 📖 [Production Deployment Guide (DEPLOYMENT.md)](file:///Users/syednizam/My_proj_ect_FK/DEPLOYMENT.md)

---

## 🧪 Live Simulation & Testing Flow

1. Open [http://localhost:5173](http://localhost:5173).
2. **Scan Table QR**: Click any dining table card (e.g. **Table 1**). You will be redirected to the table-aware customer menu: `http://localhost:5173/menu?table=1`.
3. **Place Order**: Add items (e.g., Margherita Pizza, Mojito) to your cart and click **"Place Order to Kitchen"**.
4. **Kitchen Dashboard (KDS)**: Open a private window, click **"Staff Login"** in the top right, and log in using the **Kitchen** quick-fill button (`kitchen@foodforme.com`).
   * Group orders by Table or Queue view.
   * Configure cooking countdown timers.
   * Trigger **Kitchen Order Tickets (KOT)** for printers.
   * Transition order to **Cooking** and **Ready**.
5. **Waiter Service**: Sign out and log in as **Waiter** (`waiter@foodforme.com`).
   * Coordinate high-priority ready-to-serve notifications.
   * Click **"Mark Delivered"** once served.
6. **Checkout & Bill Audit**: Return to the customer's tab and click **"Ask for Bill / Checkout"**. A monospaced receipt layout calculates the subtotal, 5% GST, and 10% Service Charge.
7. **Finalize Checkout**: Back on the Waiter Dashboard, choose **Cash**, **Card**, or **UPI** to finalize payment. The table automatically resets back to **Empty**.
8. **Admin Business Insights**: Log in as **Admin** (`admin@foodforme.com`). Explore real-time stats cards, custom SVG revenue area trends, hourly bar graphs, top ordered food meters, and downloadable sales reports.

---

## 🔑 Default Live Staff Accounts
* **Admin Role**: `admin@foodforme.com` / `password123`
* **Waiter Role**: `waiter@foodforme.com` / `password123`
* **Kitchen Role**: `kitchen@foodforme.com` / `password123`
