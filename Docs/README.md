# 🌸 Anime Orbit - Your Gateway to the Anime Universe

<div align="center">
  <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Firebase-Latest-FFCA28?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase" />
  <img src="https://img.shields.io/badge/GSAP-Animations-88CE02?style=for-the-badge&logo=greensock&logoColor=white" alt="GSAP" />
  <img src="https://img.shields.io/badge/Styled_Components-Latest-DB7093?style=for-the-badge&logo=styled-components&logoColor=white" alt="Styled Components" />
</div>

## ✨ Features

### 🎬 Anime Database

- **Browse Popular Anime**: Discover the most popular anime of all time
- **Trending Anime**: Stay updated with currently airing and trending shows
- **Search Functionality**: Find your favorite anime quickly with real-time search
- **Detailed Information**: View comprehensive details including synopsis, ratings, episodes, genres, and more
- **Character Gallery**: Explore character profiles with image galleries
- **Trailers**: Watch official trailers directly in the app

### 🔐 Authentication & User Features

- **Firebase Authentication**: Secure sign-in with email/password or Google
- **User Profiles**: Personalized user experience with profile management
- **Favourites System**: Save and manage your favorite anime
- **Protected Routes**: Favourites section requires authentication

### 🎨 Modern UI/UX

- **Japanese-Inspired Design**: Beautiful theme with anime/Japan aesthetic
- **GSAP Animations**: Smooth, professional animations throughout the app
- **Glassmorphism Effects**: Modern glass-effect UI components
- **Responsive Design**: Fully responsive on all devices
- **Scroll Animations**: Dynamic scroll-to-top/bottom button
- **Gradient Backgrounds**: Eye-catching gradient overlays and effects

### 📺 Watch Links

Direct links to watch anime on popular streaming platforms:

- Crunchyroll
- Netflix
- Amazon Prime Video
- Hulu
- Hianime

### 🎯 SEO Optimized

- Dynamic meta tags for each anime page
- Open Graph tags for social media sharing
- Twitter Card support
- Optimized for search engines

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account (for authentication and database)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/JohnChristopher777/Anime_Orbit.git
   cd shonen-anime-db
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Firebase**

   - Follow the detailed instructions in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
   - Create a `.env` file based on `.env.example`
   - Add your Firebase configuration

4. **Start the development server**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## 📁 Project Structure

```
shonen-anime-db/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── Components/
│   │   ├── AboutUs.js
│   │   ├── Airing.js
│   │   ├── Animeitem.js
│   │   ├── AuthModal.js          # Login/Signup modal
│   │   ├── Favourites.js         # Favourites page
│   │   ├── Gallery.js
│   │   ├── Globalstyle.js
│   │   ├── Homepage.js
│   │   ├── Layout.js
│   │   ├── Navbar.js             # Updated with auth
│   │   ├── Popular.js
│   │   ├── ScrollButton.js       # Scroll to top/bottom
│   │   ├── Sidebar.js            # Updated with favourites
│   │   └── Upcoming.js
│   ├── context/
│   │   ├── AuthContext.js        # Authentication context
│   │   ├── FavouritesContext.js  # Favourites management
│   │   └── global.js
│   ├── firebase/
│   │   └── config.js             # Firebase configuration
│   ├── App.js
│   └── index.js
├── .env.example
├── FIREBASE_SETUP.md
├── package.json
└── README.md
```

## 🛠️ Technologies Used

### Core

- **React 19**: Latest React with modern hooks and features
- **React Router v7**: Client-side routing
- **Styled Components**: CSS-in-JS styling solution

### Backend & Database

- **Firebase Authentication**: User authentication
- **Cloud Firestore**: Real-time database for favourites
- **Firebase Hosting**: (Optional) Deployment platform

### UI & Animations

- **GSAP**: Professional-grade animations
- **React Icons**: Beautiful icon library
- **React Toastify**: Elegant toast notifications
- **Bootstrap Icons**: Additional icon support

### API

- **Jikan API**: MyAnimeList unofficial API for anime data

## 🎨 Key Features Explained

### Authentication System

- Modal-based login/signup (no page redirects)
- Google OAuth integration
- Protected favourites section
- Persistent user sessions
- Toast notifications for user feedback

### Favourites Management

- Real-time sync with Firestore
- Add/remove anime from favourites
- Dedicated favourites page
- Firebase security rules for data protection

### GSAP Animations

- Card entrance animations with stagger effect
- Smooth scroll animations
- Hover effects and transitions
- Professional easing functions

### Responsive Design

- Mobile-first approach
- Breakpoints for tablets and desktops
- Touch-friendly interactions
- Optimized scrolling for mobile

## 📜 Available Scripts

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`

Launches the test runner in interactive watch mode

### `npm run build`

Builds the app for production to the `build` folder

### `npm run eject`

**Note: This is a one-way operation!** Ejects from Create React App

## 🚀 Deployment

### Firebase Hosting

```bash
npm run build
firebase deploy
```

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed deployment instructions.

### Netlify (Current Deployment)

1. Build the project: `npm run build`
2. Deploy the `build` folder to Netlify
3. Configure redirects in `public/_redirects`

## 🔒 Security

- Environment variables for sensitive data
- Firebase security rules for Firestore
- Protected routes for authenticated users
- HTTPS enforced in production

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is for educational purposes and fair use.

## 👨‍💻 Developer

**John Christopher**

- Email: john.christopher@animeorbit.com
- GitHub: [@JohnChristopher777](https://github.com/JohnChristopher777)

## 🙏 Acknowledgments

- [Jikan API](https://jikan.moe/) for anime data
- [MyAnimeList](https://myanimelist.net/) for the comprehensive anime database
- [Firebase](https://firebase.google.com/) for backend services
- [GSAP](https://greensock.com/gsap/) for animation capabilities

## 📞 Support

For support, email john.christopher@animeorbit.com or open an issue in the GitHub repository.

---

<div align="center">
  Made with ❤️ and lots of ☕ by John Christopher
  <br>
  © 2025 Anime Orbit. All Rights Reserved.
</div>

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
