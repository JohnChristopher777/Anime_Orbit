import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { FaHeart, FaInfoCircle, FaHome } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";

const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  right: ${({ isOpen }) => (isOpen ? "0" : "-250px")};
  width: 250px;
  height: 100vh;
  background: rgba(30, 30, 30, 0.95);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 80px;
  transition: right 0.1s ease-in-out;
  box-shadow: ${({ isOpen }) =>
    isOpen ? "-4px 0px 10px rgba(0, 0, 0, 0.3)" : "none"};
  z-index: 1100;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  &:hover {
    color: #facc15;
  }
`;

const SidebarLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-family: "Montserrat", sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  margin: 15px 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  width: 80%;

  &:hover {
    color: #facc15;
    background: rgba(255, 215, 0, 0.1);
    transform: translateX(-5px);
  }

  svg {
    font-size: 1.1rem;
  }
`;

const Divider = styled.div`
  width: 80%;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 1rem 0;
`;

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { currentUser } = useAuth();

  return (
    <SidebarContainer isOpen={isOpen}>
      <CloseButton onClick={toggleSidebar}>✖</CloseButton>

      <SidebarLink to="/" onClick={toggleSidebar}>
        <FaHome /> Home
      </SidebarLink>

      <SidebarLink to="/about" onClick={toggleSidebar}>
        <FaInfoCircle /> About Us
      </SidebarLink>

      <Divider />

      {currentUser && (
        <SidebarLink to="/favourites" onClick={toggleSidebar}>
          <FaHeart /> My Favourites
        </SidebarLink>
      )}
    </SidebarContainer>
  );
};

export default Sidebar;
