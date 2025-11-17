# Vercel Deployment Setup for Varaha Jewels

## 🚀 Automatic Deployment via GitHub Actions

This project is configured to automatically deploy to Vercel whenever you push to the `main` branch.

## 📋 Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your project connected to Vercel
3. GitHub repository secrets configured

## ⚙️ Setup Instructions

### Step 1: Install Vercel CLI (Optional, for local testing)

```bash
npm install -g vercel
```

### Step 2: Link Your Project to Vercel

1. Go to https://vercel.com and create a new project
2. Import your GitHub repository `varahaJewels-versel`
3. Configure the following settings:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 3: Get Vercel Credentials

#### Get Vercel Token:
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it "GitHub Actions Deploy"
4. Copy the token

#### Get Project ID and Org ID:
Run in your local project:
```bash
vercel link
# Follow the prompts to link your project
# Then check the .vercel/project.json file
cat .vercel/project.json
```

Or get them from Vercel Dashboard:
1. Go to your project settings
2. Project ID is in the URL and settings
3. Org ID (Team ID) is also in settings

### Step 4: Add GitHub Secrets

Go to your GitHub repository:
1. Settings → Secrets and variables → Actions
2. Click "New repository secret"

Add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VERCEL_TOKEN` | Your Vercel API token | (from Step 3) |
| `VERCEL_ORG_ID` | Your Vercel organization/team ID | team_xxxxx or user_xxxxx |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | prj_xxxxx |
| `RAZORPAY_KEY_ID` | Your Razorpay API Key ID | rzp_test_xxxxx |
| `RAZORPAY_KEY_SECRET` | Your Razorpay API Secret | (your secret key) |
| `NEXT_PUBLIC_SITE_URL` | Your production URL | https://your-domain.vercel.app |

### Step 5: Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `RAZORPAY_KEY_ID` | Your Razorpay Key ID | Production, Preview, Development |
| `RAZORPAY_KEY_SECRET` | Your Razorpay Secret | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | Your site URL | Production, Preview, Development |

## 🔄 How It Works

### Automatic Deployment:
- **Push to `main`** → Deploys to Production
- **Pull Request** → Creates Preview Deployment

### Manual Deployment (Optional):
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

## 📁 Project Structure

```
varahaJewels-main/
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions workflow
├── pages/                   # Next.js pages
├── components/              # React components
├── public/                  # Static assets
├── vercel.json             # Vercel configuration
└── package.json            # Dependencies and scripts
```

## 🛠️ Build Scripts

```json
{
  "scripts": {
    "dev": "next dev",           // Development server
    "build": "next build",       // Production build
    "start": "next start",       // Start production server
    "lint": "eslint ."          // Lint code
  }
}
```

## 🔍 Troubleshooting

### Build Fails:
- Check if all dependencies are in `package.json`
- Verify environment variables are set correctly
- Check build logs in Vercel dashboard

### Deployment Not Triggering:
- Verify GitHub Actions secrets are added
- Check `.github/workflows/deploy.yml` file exists
- Ensure you pushed to the `main` branch

### Environment Variables Not Working:
- Make sure they're added in both GitHub Secrets AND Vercel dashboard
- Restart deployment after adding variables
- Check variable names match exactly (case-sensitive)

## 📊 Monitoring

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Actions**: Repository → Actions tab
- **Deployment Logs**: Available in both Vercel and GitHub Actions

## 🔗 Useful Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Start production server locally
npm run start

# Deploy to Vercel (manual)
vercel --prod
```

## 📝 Notes

- The `.vercel` folder is git-ignored
- Environment variables are required for Razorpay integration
- Mumbai (bom1) region is set for faster performance in India
- API routes have 10-second timeout limit

## 🆘 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check GitHub Actions workflow logs
3. Verify all secrets are correctly set
4. Ensure environment variables are added in Vercel dashboard

---

**Happy Deploying! 🚀**
