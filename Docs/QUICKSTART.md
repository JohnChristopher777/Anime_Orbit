# Quick Start Guide - Anime Orbit

Get your Anime Orbit app up and running in minutes!

## 📋 Prerequisites Checklist

- [ ] Node.js (v14+) installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] Gmail account for Firebase

---

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
npm install
```

### Step 2: Create Firebase Project (2 min)

1. Go to https://console.firebase.google.com/
2. Click "Add Project"
3. Enter project name: `anime-orbit`
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Step 3: Enable Firebase Services (1 min)

**Enable Authentication:**

1. Click "Authentication" → "Get Started"
2. Enable "Email/Password"
3. Enable "Google"

**Create Firestore:**

1. Click "Firestore Database" → "Create Database"
2. Select "Start in production mode"
3. Choose location (closest to you)
4. Click "Enable"

### Step 4: Get Firebase Config (30 sec)

1. Click ⚙️ → "Project Settings"
2. Scroll to "Your apps"
3. Click web icon `</>`
4. Register app: "Anime Orbit Web"
5. Copy the `firebaseConfig` object

### Step 5: Configure Environment (30 sec)

```bash
# Copy example file
cp .env.example .env
```

Edit `.env` and paste your Firebase values:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123:web:abc123
REACT_APP_FIREBASE_MEASUREMENT_ID=G-ABC123
```

### Step 6: Start Development Server (10 sec)

```bash
npm start
```

Your app opens at http://localhost:3000 🎉

---

## ✅ Quick Test

1. **Test Search:**

   - Search for "Naruto"
   - Click on a result

2. **Test Authentication:**

   - Click "Sign In"
   - Create account or use Google
   - Verify profile shows in navbar

3. **Test Favourites:**
   - On anime detail page, click heart icon
   - Go to Favourites (from sidebar)
   - Verify anime appears

---

## 🎨 Customization Quick Tips

### Change Theme Colors

Edit `src/Components/Globalstyle.js`:

```javascript
// Change primary color from gold
background: linear-gradient(135deg, #yourcolor 0%, #yourcolor2 100%);
```

### Update Site Name

Edit `src/Components/Navbar.js` and `src/Components/Homepage.js`:

```javascript
<Logo to="/">Your Site Name</Logo>
```

### Modify Animation Speed

Edit animation durations in components:

```javascript
// In Popular.js
duration: 0.6,  // Change to your preference
stagger: 0.05,  // Change to your preference
```

---

## 🐛 Quick Troubleshooting

### "Firebase App not initialized"

- Check `.env` file exists
- Verify all Firebase variables are set
- Restart development server

### "Permission denied" on Firestore

1. Go to Firestore → Rules
2. Paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/favourites/{animeId} {
      allow read, write: if request.auth != null
                       && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

### "Unauthorized domain" error

1. Go to Firebase Console → Authentication → Settings
2. Add to Authorized domains:
   - `localhost`
   - Your deployment domain

### Animations not working

```bash
# Reinstall GSAP
npm uninstall gsap
npm install gsap
```

---

## 📚 Next Steps

After basic setup, explore:

1. **[FEATURES.md](./FEATURES.md)** - Complete feature documentation
2. **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Detailed Firebase guide
3. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy your app
4. **[README.md](./README.md)** - Full documentation

---

## 💡 Pro Tips

### Development

- Use React DevTools for debugging
- Check Network tab for API calls
- Monitor Firebase Console for database changes

### Firebase Free Tier Limits

- Authentication: Unlimited
- Firestore: 1 GB storage, 50K reads/day
- Hosting: 10 GB storage, 360 MB/day transfer

### Performance

- Keep images optimized
- Minimize API calls with caching
- Use React.memo for expensive components

---

## 🆘 Need Help?

**Common Resources:**

- Jikan API Docs: https://docs.api.jikan.moe/
- Firebase Docs: https://firebase.google.com/docs
- React Docs: https://react.dev/
- GSAP Docs: https://greensock.com/docs/

**Get Support:**

- Create GitHub Issue
- Email: john.christopher@animeorbit.com

---

## 🎯 Development Workflow

```bash
# Daily development
git pull                 # Get latest changes
npm start               # Start dev server
# Make changes
npm run build           # Test production build
git add .
git commit -m "message"
git push

# Deploy
npm run build
firebase deploy         # or netlify deploy --prod
```

---

**You're all set! Happy coding! 🚀**

Start building amazing features and enjoy your anime database!
