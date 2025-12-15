import React, { useState } from "react";
import styled from "styled-components";

const SearchBar = ({ onSearch, placeholder = "Search papers..." }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      <SearchButton type="submit">Search</SearchButton>
    </Form>
  );
};

const Form = styled.form`
  display: flex;
  gap: 0.5rem;
  width: 100%;
  max-width: 800px;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  font-size: 1rem;
  outline: none;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
  }
`;

const SearchButton = styled.button`
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 24px;
  font-weight: 500;
  transition: background 0.2s;

  &:hover {
    background: var(--primary-dark);
  }
`;

export default SearchBar;
