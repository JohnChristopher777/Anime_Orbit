import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
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
    font-family: 'Montserrat', sans-serif;
    font-weight: 900;
  }

  a, button {
    transition: all 0.3s ease-in-out;
  }

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

  .gradient-text {
    background: linear-gradient(135deg, #ffd700 0%, #ff6b9d 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

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
      &::-webkit-scrollbar-track {
        background-color: rgb(44, 44, 44);
        border-left: 1px solid rgb(60, 60, 60);
      }
    }
  }
`;

export default GlobalStyle;
