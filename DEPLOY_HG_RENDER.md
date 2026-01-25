# 🚀 Deployment Guide: Hugging Face & Render

This guide covers deploying the **Backend & AI Models** to **Hugging Face Spaces** and the **Frontend** to **Render**.

---

## Part 1: Hugging Face Spaces (Backend & Models)

We will use GitHub Actions to automatically build and push your Docker containers to Hugging Face.

### 1. Create Spaces on Hugging Face
Login to [huggingface.co](https://huggingface.co) and create two new Spaces:

1.  **Backend Space:**
    *   **Space Name:** `smartfarm-backend` (Must match this name for the workflow to work, or update `.github/workflows/deploy-hf.yml`)
    *   **SDK:** Docker
    *   **Hardware:** CPU Basic (Upgrade to stronger CPU if needed later)
    *   **Visibility:** Public or Private

2.  **Disease Model Space:**
    *   **Space Name:** `smartfarm-disease-model`
    *   **SDK:** Docker
    *   **Hardware:** CPU Upgrade (Recommended for PyTorch) or CPU Basic (Might be slow)
    *   **Visibility:** Public or Private

### 2. Get Hugging Face Token
1.  Go to **Settings** > **Access Tokens**.
2.  Create a **New Token** with **Write** permissions.
3.  Copy this token.

### 3. Configure GitHub Secrets
1.  Go to your GitHub Repository.
2.  Navigate to **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret**.
4.  Add the following secrets:
    *   `HF_USERNAME`: Your Hugging Face username (e.g., `Deep`)
    *   `HF_TOKEN`: The token you just copied.

### 4. Trigger Deployment
1.  Push your code to the `main` or `deep-new-branch` branch.
2.  Go to the **Actions** tab in GitHub to watch the build.
3.  Once finished, your Spaces on Hugging Face will update.

### 5. Configure Space Variables (On Hugging Face)
Go to the **Settings** tab of your `smartfarm-backend` Space and add these **Variables/Secrets**:
*   `SUPABASE_URL`: Your Supabase URL
*   `SUPABASE_KEY`: Your Supabase Anon Key
*   `DISEASE_MODEL_URL`: The direct URL of your second space (e.g., `https://username-smartfarm-disease-model.hf.space`)

---

## Part 2: Render (Frontend)

We will deploy the React frontend to Render, connecting it to the backend running on Hugging Face.

### 1. Create Web Service
1.  Login to [render.com](https://render.com).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.

### 2. Configuration
Render might detect the `render.yaml` file automatically. If not, select **"Build"** and ensure:
*   **Runtime:** Node
*   **Root Directory:** `client`
*   **Build Command:** `npm install && npm run build`
*   **Publish Directory:** `dist`

### 3. Environment Variables (On Render)
Add the following Environment Variables in the Render Dashboard:

*   `VITE_API_URL`: The URL of your **Backend Space** (e.g., `https://username-smartfarm-backend.hf.space`)
    *   *Note: Do not add the trailing slash `/`*
*   `VITE_DISEASE_MODEL_URL`: The URL of your **Disease Model Space** (e.g., `https://username-smartfarm-disease-model.hf.space`)
*   `VITE_SUPABASE_URL`: Your Supabase URL
*   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
*   `NODE_VERSION`: `18`

### 4. Deploy
Click **Create Web Service**. Render will build your frontend and deploy it.

---

## ✅ Verification Checklist

1.  **Backend Healthy:** Visit `https://username-smartfarm-backend.hf.space/api/regime/health` -> Should return `{"status":"healthy"}`.
2.  **Disease Model Healthy:** Visit `https://username-smartfarm-disease-model.hf.space/health` -> Should return healthy status.
3.  **Frontend Connected:** Open your Render URL. Try to log in or view the Dashboard. If data loads, the connection is successful.

## 🛠 Troubleshooting

**Issue: "Mixed Content Error"**
*   If your frontend is HTTPS (Render default) but you are trying to call an HTTP backend.
*   **Fix:** Ensure Hugging Face Spaces are accessed via `https://`.

**Issue: CORS Errors**
*   The backend is configured to allow all origins (`*`) by default in the FastAPI code, so this should work fine.

**Issue: Build Fails on GitHub**
*   Check that the Dockerfile paths are correct relative to the root.
*   Ensure the `HF_USERNAME` secret is correct.
