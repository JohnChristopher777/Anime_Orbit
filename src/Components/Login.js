

import React, { useState } from "react";
import styled from "styled-components";

const AuthContainer = styled.div`
  height: 100vh;
  background-color: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const AuthBox = styled.div`
  background: #222;
  padding: 40px;
  border-radius: 10px;
  text-align: center;
  color: white;
  width: 350px;
  box-shadow: 0px 4px 10px rgba(255, 215, 0, 0.3);
`;

const Title = styled.h2`
  margin-bottom: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 8px 0;
  border: none;
  border-radius: 5px;
  background: #333;
  color: white;
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  margin-top: 15px;
  background: gold;
  border: none;
  border-radius: 5px;
  color: black;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s;
  
  &:hover {
    background: #ffcc00;
  }
`;

const SwitchText = styled.p`
  margin-top: 15px;
  font-size: 0.9rem;
  cursor: pointer;
  color: gold;

  &:hover {
    text-decoration: underline;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 80px;
  padding: 10px;
  margin-top: 10px;
  background: #333;
  border: none;
  border-radius: 5px;
  color: white;
`;

const Message = styled.p`
  color: red;
  font-size: 0.9rem;
`;

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [Name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setMessage(""); 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLogin && password !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }
    alert(`${isLogin ? "Logged in" : "Signed up"} successfully!`);
  };

  return (
    <AuthContainer>
       <div
          className="Background"
          style={{ backgroundImage: `./bg1.jpeg` }}
        ></div>
      <AuthBox>
        <Title>{isLogin ? "Welcome back 👋!" : "Join our Crew 🏴‍☠️!"}</Title>
        <form onSubmit={handleSubmit}>
        <Input
            type="Name"
            placeholder="Enter your name"
            value={Name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {!isLogin && (
            <Input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}
          {message && <Message>{message}</Message>}

          <Button type="submit">{isLogin ? "Login" : "Sign Up"}</Button>

          <SwitchText onClick={toggleForm}>
            {isLogin
              ? "Don't have an account? Sign up here."
              : "Already have an account? Login here."}
          </SwitchText>

          {!isLogin && (
            <>
              <Textarea
                placeholder="Any suggesions as a new nakama..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </>
          )}
        </form>
      </AuthBox>
    </AuthContainer>
  );
};

export default LoginSignup;

