// import React from "react";
// import { Link } from "react-router-dom";
// import styled from "styled-components";

// const Sidebar = ({ isOpen, closeSidebar }) => {
//   return (
//     <SidebarContainer isOpen={isOpen}>
//       <CloseButton onClick={closeSidebar}>×</CloseButton>
//       <SidebarLinks>
//         <StyledLink to="/about" onClick={closeSidebar}>About Us</StyledLink>
//         <StyledLink to="/login" onClick={closeSidebar}>Login</StyledLink>
//       </SidebarLinks>
//     </SidebarContainer>
//   );
// };

// export default Sidebar;

// // Styled Components
// const SidebarContainer = styled.div`
//   position: fixed;
//   right: ${({ isOpen }) => (isOpen ? "0" : "-300px")};
//   top: 0;
//   width: 250px;
//   height: 100vh;
//   background: #1c1c1c;
//   transition: 0.4s ease-in-out;
//   padding-top: 60px;
//   box-shadow: ${({ isOpen }) => (isOpen ? "-5px 0px 10px rgba(0,0,0,0.3)" : "none")};
// `;

// const CloseButton = styled.div`
//   position: absolute;
//   top: 20px;
//   right: 20px;
//   font-size: 2rem;
//   cursor: pointer;
//   color: white;
//   transition: 0.3s;
//   &:hover {
//     color: #ff5f5f;
//   }
// `;

// const SidebarLinks = styled.div`
//   display: flex;
//   flex-direction: column;
//   padding: 20px;
// `;

// const StyledLink = styled(Link)`
//   color: white;
//   font-size: 1.4rem;
//   margin: 15px 0;
//   text-decoration: none;
//   transition: 0.3s;
//   &:hover {
//     color: #ff5f5f;
//   }
// `;

import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

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
  box-shadow: ${({ isOpen }) => (isOpen ? "-4px 0px 10px rgba(0, 0, 0, 0.3)" : "none")};
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
  font-size: 1.2rem;
  margin: 15px 0;
  &:hover {
    color: #facc15;
  }
`;

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <SidebarContainer isOpen={isOpen}>
      <CloseButton onClick={toggleSidebar}>✖</CloseButton>
      <SidebarLink to="/about" onClick={toggleSidebar}>About Us</SidebarLink>
      <SidebarLink to="/login" onClick={toggleSidebar}>Login</SidebarLink>
    </SidebarContainer>
  );
};

export default Sidebar;
