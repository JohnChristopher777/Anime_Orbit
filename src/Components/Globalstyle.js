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
    background-color: rgb(47, 47, 47);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  ::-webkit-scrollbar {
    width: 12px; 
    height: 12px; 
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.5); 
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  ::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0.2);
  }


  @media (max-width: 767px) {
    ::-webkit-scrollbar {
      width: 15px;
      height: 15px;
    }

    ::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.6);
    }

    ::-webkit-scrollbar-track {
      background-color: rgba(0, 0, 0, 0.2);
    }
  }

  body {
    position: relative;
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
    pointer-events: none;
    transition: all 0.3s ease;
  }
  
 
  body.scrolling ::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);  
    height: 10px; 
  }
  
`;

export default GlobalStyle;
