# FoodForMe - Production Deployment Guide

This handbook provides step-by-step instructions to deploy the **FoodForMe** smart restaurant platform to production utilizing **MongoDB Atlas** (Database), **Render** (Node.js API), and **Vercel** (Vite React Client).

---

## 🗄️ Phase 1: MongoDB Atlas Production Setup

1. **Create an Account / Log In**:
   * Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in.
2. **Provision a New Cluster**:
   * Create a new database deployment (choose the **M0 Shared Free Tier** cluster).
   * Pick your preferred cloud provider (AWS/GCP) and region (e.g., Singapore, Mumbai, or Virginia).
3. **Configure Database Access Security**:
   * Navigate to **Security -> Database Access**.
   * Click **Add New Database User**.
   * Configure username and a highly secure auto-generated password.
   * Assign the role: **Read and write to any database**.
4. **Configure Network Security**:
   * Navigate to **Security -> Network Access**.
   * Click **Add IP Address**.
   * Choose **Allow Access from Anywhere** (`0.0.0.0/0`) for dynamic hosting environments like Render, or configure specific server IPs if using static environments. Click **Confirm**.
5. **Acquire Connection String**:
   * Go to **Database -> Clusters**.
   * Click **Connect -> Drivers**.
   * Copy the Node.js connection string:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/foodforme?retryWrites=true&w=majority
     ```
   * Replace `<username>` and `<password>` with your created database credentials.

---

## 💻 Phase 2: Deploying Node.js Backend to Render

Render will host the Node.js Express server with automated build integrations on git push.

1. **Sign In to Render**:
   * Go to [Render Dashboard](https://dashboard.render.com/) and authorize via GitHub.
2. **Create Web Service**:
   * Click **New +** and select **Web Service**.
   * Connect the repository containing your **FoodForMe** workspace.
3. **Configure Build Settings**:
   * **Name**: `foodforme-backend`
   * **Region**: Choose the same region as your MongoDB Atlas cluster.
   * **Branch**: `main` (or active branch)
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
4. **Configure Environment Variables**:
   * Expand the **Advanced** section and add the following Environment Variables:
     * `PORT`: `10000` (Render handles port mappings automatically, but specifying 10000 ensures explicit binding)
     * `NODE_ENV`: `production`
     * `MONGO_URI`: `your_mongodb_atlas_connection_string`
     * `JWT_SECRET`: `your_extremely_secure_32_character_jwt_key`
     * `ALLOWED_ORIGINS`: `https://your-foodforme-client.vercel.app` (Your Vercel URL, configured in Phase 3)
5. **Deploy**:
   * Click **Create Web Service**. Wait for the logs to say `Server running on port 10000` and `MongoDB Connected`.
   * Copy your service URL (e.g., `https://foodforme-backend.onrender.com`).

---

## 🎨 Phase 3: Deploying Vite React Frontend to Vercel

Vercel is optimized for instant loading static frontend sites and single-page applications.

1. **Sign In to Vercel**:
   * Visit the [Vercel Dashboard](https://vercel.com/) and sign in with your GitHub account.
2. **Import Project**:
   * Click **Add New... -> Project**.
   * Select your **FoodForMe** repository.
3. **Configure Project Overrides**:
   * **Framework Preset**: `Vite` (Auto-detected)
   * **Root Directory**: `frontend`
   * **Build and Output Settings**:
     * **Build Command**: `npm run build`
     * **Output Directory**: `dist` (Auto-detected)
4. **Configure Client Environment Variables**:
   * Under the **Environment Variables** accordion, add:
     * `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api` (The Render backend URL from Phase 2)
5. **Deploy**:
   * Click **Deploy**. Vercel will build the frontend assets, compile JSX, and host the client.
   * Retrieve your production Vercel client URL (e.g., `https://foodforme-client.vercel.app`).
6. **Hardening the Loop**:
   * Return to your Render Backend web service dashboard and update the `ALLOWED_ORIGINS` environment variable to include this final Vercel client URL!

---

## 🗃️ Phase 4: Production Database Seeding

To seed your production database with tables, users (Admin, Waiter, Kitchen), and the default menu catalog, use the secure seeding script.

Because `seed.js` blocks execution when `NODE_ENV=production` is active, you must override it explicitly:

### Option A: Remote seeding from Local Machine (Recommended)
1. In your local `backend/.env` file, temporarily replace your local MONGO_URI with the production **MongoDB Atlas connection string**.
2. Run the seeding script locally with the force flag:
   ```bash
   NODE_ENV=production FORCE_SEED=true npm run seed
   ```
3. Revert your local `backend/.env` file back to `mongodb://127.0.0.1:27017/foodforme` to prevent local tests from touching production.

### Option B: Deploying Seed via SSH/Terminal inside Render
1. Inside the Render Dashboard, open the Shell tab of your Web Service.
2. Run the seeding script with explicit overrides:
   ```bash
   NODE_ENV=production FORCE_SEED=true npm run seed
   ```

---

## 🔒 Phase 5: Pre-Launch Security & Verification Checklist

* [ ] **CORS Settings Checked**: Verify that `ALLOWED_ORIGINS` strictly specifies the production Vercel URL and doesn't permit wildcards in production.
* [ ] **JWT Key Strengthened**: Verify that `JWT_SECRET` is not the default value.
* [ ] **Health Endpoint Active**: Check `https://your-backend.onrender.com/api/health` to confirm memory allocation and DB status.
* [ ] **SPA Route Reload Checks**: Go to the Vercel client website, navigate to the `/menu` page, and refresh the browser. Confirm Vercel does not return a 404, verifying `vercel.json` rewrites are functioning.
* [ ] **Admin Pages Verified**: Confirm that accessing the `/admin` dashboard prompts for authentication and strictly blocks guests or waiters.
