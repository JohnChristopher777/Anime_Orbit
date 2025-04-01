// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import styled from "styled-components";
// import Sidebar from "./Sidebar";

// const Navbar = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const navigate = useNavigate();

//   return (
//     <>
//       <NavbarContainer>
//         <Logo to="/">Anime Orbit</Logo>
//         <NavLinks>
//           <NavButton to="/">Home</NavButton>
//           <NavButton onClick={() => navigate(-1)}>Back</NavButton>
//           <MenuIcon onClick={() => setSidebarOpen(true)}>☰</MenuIcon>
//         </NavLinks>
//       </NavbarContainer>
//       <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
//     </>
//   );
// };

// export default Navbar;

// // Styled Components
// const NavbarContainer = styled.nav`
//   position: fixed;
//   top: 0;
//   width: 100%;
//   background-color: black;
//   color: white;
//   padding: 15px;
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
//   z-index: 1000;
// `;

// const Logo = styled(Link)`
//   font-size: 1.8rem;
//   font-weight: bold;
//   color: white;
//   text-decoration: none;
//   &:hover {
//     color: #facc15;
//   }
// `;

// const NavLinks = styled.div`
//   display: flex;
//   gap: 20px;
//   align-items: center;
// `;

// const NavButton = styled(Link)`
//   background: transparent;
//   border: 2px solid gray;
//   color: white;
//   padding: 8px 15px;
//   font-size: 1rem;
//   text-decoration: none;
//   border-radius: 8px;
//   transition: all 0.3s ease-in-out;
//   &:hover {
//     background: rgb(168, 168, 168);
//     color: black;
//   }
// `;

// const SearchBar = styled.input`
//   background: white;
//   color: black;
//   border: none;
//   padding: 8px 15px;
//   border-radius: 5px;
//   font-size: 1rem;
//   width: 200px;
//   outline: none;
// `;

// const MenuIcon = styled.div`
//   font-size: 2rem;
//   cursor: pointer;
//   transition: 0.3s;
//   &:hover {
//     color: #ff5f5f;
//   }
// `;








import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import Sidebar from "./Sidebar"; 

const NavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  width: 100%;
  background-color: black;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
`;

const Logo = styled(Link)`
  font-family: "Bungee", cursive;
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  &:hover {
    color: #facc15;
  }
`;

const MenuButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  &:hover {
    color: #facc15;
  }
`;

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <NavbarContainer>
        <Logo to="/">Anime Orbit</Logo>
        <MenuButton onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </MenuButton>
      </NavbarContainer>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
    </>
  );
};

export default Navbar;
