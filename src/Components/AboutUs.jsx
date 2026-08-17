import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Mail, MapPin, Code, Globe, Github, Heart } from "lucide-react";

const AboutUs = () => {
  return (
    <AboutContainer>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <HeroBanner>
          <GlowOrb className="orb-1" />
          <GlowOrb className="orb-2" />
          <HeroContent>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              About <span className="highlight">Anime Orbit</span>
            </motion.h1>
            <motion.p
              className="tagline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Your ultimate hub for everything anime. Discover, track, and explore
              thousands of anime titles with detailed information, ratings, and more.
            </motion.p>
          </HeroContent>
        </HeroBanner>
      </motion.div>

      <ContentGrid>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <FeatureCard>
            <div className="icon-wrapper">
              <Globe size={28} />
            </div>
            <h3>Massive Database</h3>
            <p>Access detailed info on thousands of anime, powered by AniList's comprehensive API.</p>
          </FeatureCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <FeatureCard>
            <div className="icon-wrapper">
              <Heart size={28} />
            </div>
            <h3>Personal Tracking</h3>
            <p>Build your watchlist, mark favourites, and keep track of everything you've watched.</p>
          </FeatureCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <FeatureCard>
            <div className="icon-wrapper">
              <Code size={28} />
            </div>
            <h3>Open Source</h3>
            <p>Built with React, Firebase, and modern web technologies. Community-driven development.</p>
          </FeatureCard>
        </motion.div>
      </ContentGrid>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <DeveloperCard>
          <CardGlow />
          <DevAvatar>
            <div className="avatar-circle">
              <Code size={40} color="#ffd700" />
            </div>
            <div className="status-dot" />
          </DevAvatar>
          <DevInfo>
            <h2>John Christopher</h2>
            <span className="role">Full Stack Developer & Creator</span>
            <Divider />
            <ContactList>
              <ContactItem>
                <Mail size={16} />
                <a href="mailto:john.christopher@animeorbit.com">
                  john.christopher@animeorbit.com
                </a>
              </ContactItem>
              <ContactItem>
                <MapPin size={16} />
                <span>123 Anime Street, Tokyo, Japan</span>
              </ContactItem>
              <ContactItem>
                <Github size={16} />
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  github.com/johnchristopher
                </a>
              </ContactItem>
            </ContactList>
          </DevInfo>
        </DeveloperCard>
      </motion.div>

      <FooterSection>
        <p>© {new Date().getFullYear()} Anime Orbit. Built with <Heart size={14} fill="#ff4d4d" color="#ff4d4d" style={{ verticalAlign: 'middle' }} /> for anime fans everywhere.</p>
      </FooterSection>
    </AboutContainer>
  );
};

const AboutContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%);
  color: white;
  padding: 2rem 5%;
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;

const HeroBanner = styled.div`
  position: relative;
  background: linear-gradient(145deg, rgba(30, 30, 30, 0.8), rgba(15, 15, 15, 0.9));
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: 24px;
  padding: 4rem 3rem;
  text-align: center;
  overflow: hidden;
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    padding: 2.5rem 1.5rem;
  }
`;

const GlowOrb = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  pointer-events: none;

  &.orb-1 {
    width: 300px;
    height: 300px;
    background: #ffd700;
    top: -100px;
    left: -50px;
  }

  &.orb-2 {
    width: 250px;
    height: 250px;
    background: #ff6b9d;
    bottom: -80px;
    right: -30px;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;

  h1 {
    font-family: "Staatliches", cursive;
    font-size: 3.5rem;
    font-weight: 400;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 1rem;
    color: white;

    .highlight {
      color: #ffd700;
      text-shadow: 0 0 30px rgba(255, 215, 0, 0.4);
    }

    @media (max-width: 768px) {
      font-size: 2.2rem;
    }
  }

  .tagline {
    font-family: "Inter", "Noto Sans JP", sans-serif;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.8;
    max-width: 600px;
    margin: 0 auto;

    @media (max-width: 768px) {
      font-size: 0.95rem;
    }
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const FeatureCard = styled.div`
  background: linear-gradient(145deg, rgba(40, 40, 40, 0.6), rgba(20, 20, 20, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);

  &:hover {
    border-color: rgba(255, 215, 0, 0.3);
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .icon-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    color: #ffd700;
  }

  h3 {
    font-family: "Montserrat", sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: white;
    margin-bottom: 0.75rem;
  }

  p {
    font-family: "Inter", sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1.6;
  }
`;

const DeveloperCard = styled.div`
  position: relative;
  background: linear-gradient(145deg, rgba(35, 35, 35, 0.9), rgba(18, 18, 18, 0.95));
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 20px;
  padding: 3rem;
  display: flex;
  align-items: center;
  gap: 2.5rem;
  overflow: hidden;
  backdrop-filter: blur(10px);
  max-width: 700px;
  margin: 0 auto;

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.5rem;
  }
`;

const CardGlow = styled.div`
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  top: -50px;
  right: -50px;
  pointer-events: none;
`;

const DevAvatar = styled.div`
  position: relative;
  flex-shrink: 0;

  .avatar-circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05));
    border: 3px solid #ffd700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.2);
  }

  .status-dot {
    position: absolute;
    bottom: 5px;
    right: 5px;
    width: 16px;
    height: 16px;
    background: #27ae60;
    border-radius: 50%;
    border: 3px solid #1a1a1a;
  }
`;

const DevInfo = styled.div`
  h2 {
    font-family: "Montserrat", sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: white;
    margin: 0 0 0.3rem 0;
  }

  .role {
    font-family: "Inter", sans-serif;
    font-size: 0.9rem;
    color: #ffd700;
    font-weight: 500;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 1.2rem 0;
`;

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);

  svg {
    color: #ffd700;
    flex-shrink: 0;
  }

  a {
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #ffd700;
    }
  }
`;

const FooterSection = styled.div`
  text-align: center;
  padding: 2rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  p {
    font-family: "Inter", sans-serif;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.4);
  }
`;

export default AboutUs;
