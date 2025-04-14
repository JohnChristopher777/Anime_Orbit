
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
  font-size: 2rem;
  color: gold;
`;

const Info = styled.p`
  margin: 10px 0;
  font-size: 1rem;
  color: #ddd;
`;

const Footer = styled.footer`
  margin-top: 40px;
  font-size: 0.9rem;
  color: #aaa;
`;

const AboutUs = () => {
  return (
    <AboutContainer>
      <AboutBox>
        <Title>About Us</Title>
        <Info>Welcome to Anime Orbit! Your hub for everything anime.</Info>

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
