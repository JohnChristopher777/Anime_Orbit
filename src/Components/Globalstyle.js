import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Bungee&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    list-style: none;
    text-decoration: none;
    font-family: 'Inter', sans-serif; 
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
`;

export default GlobalStyle;