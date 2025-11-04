import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

const ScrollButton = () => {
    const [isAtTop, setIsAtTop] = useState(true);
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // Show button after scrolling 300px
            setShowButton(scrollTop > 300);

            // Check if at top
            setIsAtTop(scrollTop < 100);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    };

    const handleClick = () => {
        if (isAtTop) {
            scrollToBottom();
        } else {
            scrollToTop();
        }
    };

    if (!showButton) return null;

    return (
        <ScrollButtonStyled onClick={handleClick} isAtTop={isAtTop}>
            {isAtTop ? <FaArrowDown size={20} /> : <FaArrowUp size={20} />}
        </ScrollButtonStyled>
    );
};

const ScrollButtonStyled = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a1a;
  border: none;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  transition: all 0.3s ease;
  animation: ${props => props.isAtTop ? 'bounce-down' : 'bounce-up'} 2s infinite;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
  }

  &:active {
    transform: scale(0.95);
  }

  @keyframes bounce-up {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes bounce-down {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(10px); }
  }

  @media (max-width: 768px) {
    width: 45px;
    height: 45px;
    bottom: 1.5rem;
    right: 1.5rem;
  }
`;

export default ScrollButton;
