import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await register({ name, email, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <FormCard>
        <Title>Register for ScholarDemon</Title>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </SubmitButton>
        </Form>

        <Footer>
          Already have an account? <Link to="/login">Login here</Link>
        </Footer>
      </FormCard>
    </Container>
  );
};

const Container = styled.div`
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  padding: 2rem;
`;

const FormCard = styled.div`
  background: var(--background);
  border-radius: 8px;
  padding: 2.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 12px var(--shadow);
`;

const Title = styled.h1`
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: var(--text-primary);
`;

const ErrorMessage = styled.div`
  background: #fef0f0;
  color: var(--danger);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: var(--text-primary);
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
  }
`;

const SubmitButton = styled.button`
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    background: var(--primary-dark);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Footer = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  color: var(--text-secondary);
`;

export default Register;
