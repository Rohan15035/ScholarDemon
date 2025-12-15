import React, { useState } from "react";
import styled from "styled-components";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await updateUser({ name });
      setMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      setMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password");
    }
  };

  return (
    <Container className="container">
      <Title>Profile Settings</Title>

      {message && <SuccessMessage>{message}</SuccessMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Section>
        <SectionTitle>Profile Information</SectionTitle>

        {isEditing ? (
          <Form onSubmit={handleUpdateProfile}>
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
              <Input type="email" value={user?.email} disabled />
              <Help>Email cannot be changed</Help>
            </FormGroup>

            <ButtonGroup>
              <Button type="submit">Save Changes</Button>
              <ButtonSecondary onClick={() => setIsEditing(false)}>
                Cancel
              </ButtonSecondary>
            </ButtonGroup>
          </Form>
        ) : (
          <InfoDisplay>
            <InfoRow>
              <InfoLabel>Name:</InfoLabel>
              <InfoValue>{user?.name}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Email:</InfoLabel>
              <InfoValue>{user?.email}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Role:</InfoLabel>
              <InfoValue>{user?.role}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Verified:</InfoLabel>
              <InfoValue>{user?.is_verified ? "Yes" : "No"}</InfoValue>
            </InfoRow>

            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </InfoDisplay>
        )}
      </Section>

      <Section>
        <SectionTitle>Change Password</SectionTitle>

        <Form onSubmit={handleChangePassword}>
          <FormGroup>
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </FormGroup>

          <Button type="submit">Change Password</Button>
        </Form>
      </Section>
    </Container>
  );
};

const Container = styled.div`
  padding: 2rem 0;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.div`
  background: #fef0f0;
  color: var(--danger);
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const Section = styled.section`
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
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

  &:disabled {
    background: var(--surface);
    cursor: not-allowed;
  }
`;

const Help = styled.small`
  color: var(--text-secondary);
  font-size: 0.85rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const Button = styled.button`
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;

  &:hover {
    background: var(--primary-dark);
  }
`;

const ButtonSecondary = styled.button`
  background: white;
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;

  &:hover {
    background: var(--surface);
  }
`;

const InfoDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);

  &:last-of-type {
    border-bottom: none;
  }
`;

const InfoLabel = styled.div`
  font-weight: 500;
  min-width: 150px;
  color: var(--text-secondary);
`;

const InfoValue = styled.div`
  color: var(--text-primary);
`;

export default Profile;
