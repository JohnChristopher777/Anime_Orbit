import React, { useState } from "react";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext.jsx";
import { FcGoogle } from "react-icons/fc";
import { IoClose } from "react-icons/io5";

const AuthModal = ({ isOpen, onClose, initialMode = "login" }) => {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup, signInWithGoogle } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!displayName.trim()) {
          alert("Please enter your name");
          setLoading(false);
          return;
        }
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
      onClose();
      resetForm();
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Google sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    resetForm();
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <IoClose />
        </CloseButton>

        <ModalHeader>
          <h2>{mode === "login" ? "Welcome Back!" : "Join Anime Orbit"}</h2>
          <p>
            {mode === "login"
              ? "Sign in to access your favourites"
              : "Create your account to start saving favourites"}
          </p>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <InputGroup>
              <Label>Name</Label>
              <Input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </InputGroup>
          )}

          <InputGroup>
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </InputGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Sign Up"}
          </SubmitButton>
        </Form>

        <Divider>
          <span>OR</span>
        </Divider>

        <GoogleButton onClick={handleGoogleSignIn} disabled={loading}>
          <FcGoogle size={24} />
          <span>Continue with Google</span>
        </GoogleButton>

        <ToggleMode>
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <ToggleLink onClick={toggleMode}>
            {mode === "login" ? "Sign Up" : "Sign In"}
          </ToggleLink>
        </ToggleMode>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 100%);
  border-radius: 20px;
  padding: 2.5rem;
  width: 90%;
  max-width: 450px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 215, 0, 0.3);
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #ffd700;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: rotate(90deg);
    color: #fff;
  }
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h2 {
    font-family: "Staatliches", cursive;
    color: #ffd700;
    font-size: 2.2rem;
    font-weight: 400;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
  }

  p {
    font-family: "Inter", "Noto Sans JP", sans-serif;
    color: #b0b0b0;
    font-size: 0.95rem;
    font-weight: 400;
    letter-spacing: 0.01em;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-family: "Montserrat", sans-serif;
  color: #ffd700;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Input = styled.input`
  padding: 0.9rem;
  border: 2px solid #444;
  border-radius: 10px;
  background: #1a1a1a;
  color: white;
  font-family: "Inter", "Noto Sans JP", sans-serif;
  font-size: 1rem;
  font-weight: 400;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ffd700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }

  &::placeholder {
    color: #666;
  }
`;

const SubmitButton = styled.button`
  padding: 1rem;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a1a;
  border: none;
  border-radius: 10px;
  font-family: "Montserrat", sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: #666;

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid #444;
  }

  span {
    font-family: "Montserrat", sans-serif;
    padding: 0 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.1em;
  }
`;

const GoogleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  color: #333;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-family: "Inter", "Noto Sans JP", sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: #f5f5f5;
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ToggleMode = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  font-family: "Inter", "Noto Sans JP", sans-serif;
  color: #b0b0b0;
  font-size: 0.95rem;
  font-weight: 400;
  letter-spacing: 0.01em;
`;

const ToggleLink = styled.span`
  font-family: "Montserrat", sans-serif;
  color: #ffd700;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    text-decoration: underline;
    color: #ffed4e;
  }
`;

export default AuthModal;
