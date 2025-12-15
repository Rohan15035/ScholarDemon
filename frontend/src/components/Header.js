import React from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <HeaderContainer>
      <Nav className="container">
        <Logo to="/">
          <LogoText>ScholarDemon</LogoText>
        </Logo>

        <NavLinks>
          <NavLink to="/search">Search</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/feed">Feed</NavLink>
              <NavLink to="/library">Library</NavLink>
              <NavLink to="/profile">{user?.name}</NavLink>
              <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <RegisterButton to="/register">Register</RegisterButton>
            </>
          )}
        </NavLinks>
      </Nav>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  background: var(--background);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px var(--shadow);
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 20px;
`;

const Logo = styled(Link)`
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
`;

const LogoText = styled.h1`
  font-size: 1.5rem;
  color: var(--primary);
  margin: 0;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const NavLink = styled(Link)`
  color: var(--text-primary);
  font-weight: 500;

  &:hover {
    color: var(--primary);
    text-decoration: none;
  }
`;

const LogoutButton = styled.button`
  background: transparent;
  border: 1px solid var(--border);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  color: var(--text-primary);

  &:hover {
    background: var(--surface);
  }
`;

const RegisterButton = styled(Link)`
  background: var(--primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;

  &:hover {
    background: var(--primary-dark);
    text-decoration: none;
    color: white;
  }
`;

export default Header;
