
import React from "react";
import styled from "styled-components";

const AboutContainer = styled.div`
  min-height: 100vh;
  background: black;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 50px;
`;

const AboutBox = styled.div`
  max-width: 600px;
  background: #222;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(255, 215, 0, 0.3);
`;

const Title = styled.h1`
  font-family: 'Staatliches', cursive;
  font-size: 2.5rem;
  font-weight: 400;
  color: gold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
`;

const Info = styled.p`
  margin: 10px 0;
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
  font-size: 1.05rem;
  font-weight: 400;
  color: #ddd;
  line-height: 1.6;
  letter-spacing: 0.01em;
`;

const Footer = styled.footer`
  margin-top: 40px;
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
  font-size: 0.9rem;
  font-weight: 400;
  color: #aaa;
  letter-spacing: 0.01em;
`;

const AboutUs = () => {
  return (
    <AboutContainer>
      <AboutBox>
        <Title>About Us</Title>
        <Info>Welcome to Anime Orbit! Your hub for everything about anime.</Info>

        <Title>Developer</Title>
        <Info><strong>Name:</strong> John Christopher</Info>
        <Info><strong>Email:</strong>john.christopher@animeorbit.com</Info>
        <Info><strong>Address:</strong> 123 Anime Street, Tokyo, Japan</Info>
      </AboutBox>

      <Footer>© 2025 Anime Orbit. All Rights Reserved.</Footer>
    </AboutContainer>
  );
};

export default AboutUs;
