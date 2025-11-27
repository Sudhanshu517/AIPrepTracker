# 🚀 AIPrepTracker  
AI-powered DSA progress tracker built with React, Express, PostgreSQL and Gemini AI.

AIPrepTracker helps you track your LeetCode/GFG progress, visualize your strengths, and get AI-powered recommendations to improve your interview preparation.

---

## ✨ Features
- 🔗 One-click sync with LeetCode, GFG, TUF+ (Puppeteer scrapers)
- 📊 Interactive dashboard with charts and progress analytics  
- 🤖 AI recommendations powered by Google Gemini  
- 🧪 Add/edit custom problems  
- 🔐 Secure authentication via Clerk  
- 🏗 Monolithic deployment (Express serves Vite + API)

---

## 🛠 Tech Stack
**Frontend:** React (Vite), TypeScript, Tailwind, ShadCN UI, React Query  
**Backend:** Node.js, Express, Drizzle ORM, PostgreSQL, Puppeteer, node-cron  
**AI:** Google Gemini API  
**Deployment:** Render/Railway  

---

## 🚀 Running Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Add environment variables
Create a `.env` file in the root:

```
DATABASE_URL=
DIRECT_URL=
CLERK_SECRET_KEY=
VITE_CLERK_PUBLISHABLE_KEY=
GEMINI_API_KEY=
NODE_ENV=development
```

### 3. Start development
```bash
npm run dev
```

### 4. Build production
```bash
npm run build
```

### 5. Start production server
```bash
npm start
```

---

## 🌐 Deployment (Render/Railway)

**Build Command**
```
npm run build
```

**Start Command**
```
npm start
```

---

## ⭐ Support
If you like this project, consider giving it a star!
