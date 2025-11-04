import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Noto+Sans+JP:wght@300;400;500;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    list-style: none;
    text-decoration: none;
  }

  body {
    color: #e5e7eb; 
    font-family: 'Noto Sans JP', sans-serif;
    font-size: 1.2rem;
    overflow-y: auto;
    background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 50%, #1a1a1a 100%);
    position: relative;
    
    &::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255, 77, 77, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 40% 90%, rgba(106, 17, 203, 0.05) 0%, transparent 50%);
      pointer-events: none;
      z-index: -1;
    }

    &::-webkit-scrollbar {
      width: 12px;
    }
    &::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #ffd700 0%, #ff8c00 100%);
      border-radius: 10px;
      border: 2px solid #1a1a1a;
      transition: background-color 0.3s ease;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, #ffed4e 0%, #ffa500 100%);
    }
    &::-webkit-scrollbar-track {
      background-color: rgb(44, 44, 44);
      border-left: 1px solid rgba(255, 215, 0, 0.2);
    }
  }

  .logo-text, .brand-text {
    font-family: 'Bungee', cursive;
  }

  a, button {
    transition: all 0.3s ease-in-out;
  }

  /* Glassmorphism utility classes */
  .glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .glass-dark {
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Anime/Japanese themed decorative elements */
  .sakura-effect {
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '🌸';
      position: absolute;
      font-size: 20px;
      opacity: 0.3;
      animation: fall 10s infinite;
    }
  }

  @keyframes fall {
    0% {
      top: -10%;
      transform: translateX(0) rotate(0deg);
    }
    100% {
      top: 110%;
      transform: translateX(100px) rotate(360deg);
    }
  }

  /* Modern gradient text */
  .gradient-text {
    background: linear-gradient(135deg, #ffd700 0%, #ff6b9d 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Neon glow effect */
  .neon-glow {
    text-shadow: 
      0 0 10px rgba(255, 215, 0, 0.5),
      0 0 20px rgba(255, 215, 0, 0.3),
      0 0 30px rgba(255, 215, 0, 0.2);
  }

  @media (max-width: 767px) {
    body {
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y; 
      overflow-y: scroll;
      scrollbar-width: auto;
      -webkit-scrollbar-width: auto; 
      &::-webkit-scrollbar {
        width: 15px; 
        height: 15px; 
      }
      &::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #ffd700 0%, #ff8c00 100%);
        border-radius: 10px;
        border: 3px solid rgb(44, 44, 44); 
        box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.5);
      }
      &::-webkit-scrollbar-thumb:active {
        background: linear-gradient(180deg, #ffed4e 0%, #ffa500 100%);
      }
      &::-webkit-scrollbar-track {
        background-color: rgb(44, 44, 44);
        border-left: 1px solid rgb(60, 60, 60);
      }
    }
   
    body::after {
      content: '';
      position: fixed;
      top: 0;
      right: 0;
      width: 15px;
      height: 100%;
      background: transparent;
      z-index: 9999;
      pointer-events: auto;
    }
  }
`;

export default GlobalStyle;