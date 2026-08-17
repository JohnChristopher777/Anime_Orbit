import React, { useState } from "react";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext.jsx";
import { X, Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GoogleIconSvg = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AuthModal = ({ isOpen, onClose, initialMode = "login" }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'signup', or 'forgot'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, signup, signInWithGoogle, resetPassword } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        await resetPassword(email);
        setMode("login");
        resetForm();
      } else if (mode === "signup") {
        if (!displayName.trim()) {
          alert("Please enter your name");
          setLoading(false);
          return;
        }
        await signup(email, password, displayName);
        onClose();
        resetForm();
      } else {
        await login(email, password);
        onClose();
        resetForm();
      }
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
    setShowPassword(false);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const getTitle = () => {
    switch (mode) {
      case "signup": return "Join Anime Orbit";
      case "forgot": return "Reset Password";
      default: return "Welcome Back!";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "signup": return "Create your account to start saving favourites";
      case "forgot": return "Enter your email and we'll send you a reset link";
      default: return "Sign in to access your favourites";
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent
        onClick={(e) => e.stopPropagation()}
        as={motion.div}
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <GlowEffect />
        <CloseButton onClick={onClose} aria-label="Close">
          <X size={22} />
        </CloseButton>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === "forgot" ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === "forgot" ? -30 : 30 }}
            transition={{ duration: 0.25 }}
          >
            {mode === "forgot" && (
              <BackButton onClick={() => switchMode("login")}>
                <ArrowLeft size={18} />
                <span>Back to Sign In</span>
              </BackButton>
            )}

            <ModalHeader>
              <h2>{getTitle()}</h2>
              <p>{getSubtitle()}</p>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              {mode === "signup" && (
                <InputGroup>
                  <Label>Name</Label>
                  <InputWrapper>
                    <InputIcon>
                      <UserIcon size={18} />
                    </InputIcon>
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </InputWrapper>
                </InputGroup>
              )}

              <InputGroup>
                <Label>Email</Label>
                <InputWrapper>
                  <InputIcon>
                    <Mail size={18} />
                  </InputIcon>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </InputWrapper>
              </InputGroup>

              {mode !== "forgot" && (
                <InputGroup>
                  <Label>Password</Label>
                  <InputWrapper>
                    <InputIcon>
                      <Lock size={18} />
                    </InputIcon>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <TogglePasswordButton
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </TogglePasswordButton>
                  </InputWrapper>
                </InputGroup>
              )}

              {mode === "login" && (
                <ForgotLink onClick={() => switchMode("forgot")}>
                  Forgot your password?
                </ForgotLink>
              )}

              <SubmitButton type="submit" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : mode === "forgot"
                  ? "Send Reset Link"
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </SubmitButton>
            </Form>

            {mode !== "forgot" && (
              <>
                <Divider>
                  <span>OR</span>
                </Divider>

                <GoogleButton onClick={handleGoogleSignIn} disabled={loading}>
                  <GoogleIconSvg />
                  <span>Continue with Google</span>
                </GoogleButton>
              </>
            )}

            {mode !== "forgot" && (
              <ToggleMode>
                {mode === "login"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <ToggleLink onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
                  {mode === "login" ? "Sign Up" : "Sign In"}
                </ToggleLink>
              </ToggleMode>
            )}
          </motion.div>
        </AnimatePresence>
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
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
  padding: 1rem;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  position: relative;
  background: linear-gradient(145deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.98));
  border-radius: 24px;
  padding: 2.5rem;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.15);
  overflow: hidden;
  backdrop-filter: blur(20px);
`;

const GlowEffect = styled.div`
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  top: -80px;
  right: -60px;
  pointer-events: none;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 2;

  &:hover {
    background: rgba(255, 215, 0, 0.15);
    border-color: rgba(255, 215, 0, 0.3);
    color: #ffd700;
    transform: rotate(90deg);
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  color: #ffd700;
  font-family: "Montserrat", sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
  padding: 0;
  transition: all 0.2s ease;

  &:hover {
    color: #ffed4e;
    transform: translateX(-3px);
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
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
  }

  p {
    font-family: "Inter", "Noto Sans JP", sans-serif;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    font-weight: 400;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const Label = styled.label`
  font-family: "Montserrat", sans-serif;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  pointer-events: none;
  z-index: 1;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 3rem;
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: white;
  font-family: "Inter", "Noto Sans JP", sans-serif;
  font-size: 0.95rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: rgba(255, 215, 0, 0.5);
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
  transition: color 0.2s ease;

  &:hover {
    color: #ffd700;
  }
`;

const ForgotLink = styled.span`
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 215, 0, 0.7);
  cursor: pointer;
  text-align: right;
  margin-top: -0.5rem;
  font-weight: 500;
  transition: color 0.2s ease;

  &:hover {
    color: #ffd700;
    text-decoration: underline;
  }
`;

const SubmitButton = styled.button`
  padding: 0.95rem;
  background: linear-gradient(135deg, #ffd700 0%, #ffea00 100%);
  color: #1a1a1a;
  border: none;
  border-radius: 12px;
  font-family: "Montserrat", sans-serif;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.35);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: rgba(255, 255, 255, 0.2);

  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  span {
    font-family: "Montserrat", sans-serif;
    padding: 0 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.1em;
  }
`;

const GoogleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.85rem;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-family: "Inter", "Noto Sans JP", sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ToggleMode = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  font-family: "Inter", "Noto Sans JP", sans-serif;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.9rem;
`;

const ToggleLink = styled.span`
  font-family: "Montserrat", sans-serif;
  color: #ffd700;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    text-decoration: underline;
    color: #ffed4e;
  }
`;

export default AuthModal;
