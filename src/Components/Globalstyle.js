import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    list-style: none;
    text-decoration: none;
  }

  body {
    color: #e5e7eb; 
    font-size: 1.2rem;
    overflow-y: auto;
    background-color: rgb(47, 47, 47); 
    &::-webkit-scrollbar {
      width: 9px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgb(180, 180, 180); 
      border-radius: 10px;
      transition: background-color 0.3s ease;
    }
    &::-webkit-scrollbar-thumb:hover {
      background-color: #facc15; 
    }
    &::-webkit-scrollbar-track {
      background-color: rgb(44, 44, 44); 
    }
  }

  h1, h2, h3, h4, button, .bungee-text {
    font-family: 'Bungee', cursive;
  }

  a, button {
    transition: all 0.3s ease-in-out;
  }

  @media (max-width: 767px) {
    body {
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y; 
      overflow-y: scroll; 
      -webkit-scrollbar-width: auto; 
      &::-webkit-scrollbar {
        width: 15px; 
        height: 15px; 
      }
      &::-webkit-scrollbar-thumb {
        background-color: rgb(180, 180, 180);
        border-radius: 10px;
        border: 3px solid rgb(44, 44, 44); 
        box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.5);
      }
      &::-webkit-scrollbar-thumb:active {
        background-color: #facc15;
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
  } `;

export default GlobalStyle;