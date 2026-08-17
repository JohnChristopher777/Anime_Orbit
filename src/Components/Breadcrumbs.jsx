import React from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { ChevronRight, Home } from "lucide-react";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const formatBreadcrumb = (str) => {
    return str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <BreadcrumbContainer>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Link to="/">
            <Home size={16} />
            <span>Home</span>
          </Link>
        </BreadcrumbItem>

        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;

          return (
            <React.Fragment key={routeTo}>
              <ChevronRight size={16} className="separator" />
              <BreadcrumbItem className={isLast ? "active" : ""}>
                {isLast ? (
                  <span>{formatBreadcrumb(name)}</span>
                ) : (
                  <Link to={routeTo}>{formatBreadcrumb(name)}</Link>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbContainer>
  );
};

const BreadcrumbContainer = styled.nav`
  padding: 1rem 2rem;
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 234, 0, 0.1);
  font-family: "Montserrat", sans-serif;
`;

const BreadcrumbList = styled.ol`
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;

  .separator {
    color: rgba(255, 234, 0, 0.5);
    flex-shrink: 0;
  }
`;

const BreadcrumbItem = styled.li`
  display: flex;
  align-items: center;

  a,
  span {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #b0b0b0;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s ease;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;

    &:hover {
      color: #ffea00;
      background: rgba(255, 234, 0, 0.1);
    }
  }

  &.active span {
    color: #ffea00;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    a,
    span {
      font-size: 0.8rem;
      padding: 0.2rem 0.4rem;
    }
  }
`;

export default Breadcrumbs;
