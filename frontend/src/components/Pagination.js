import React from "react";
import styled from "styled-components";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  const maxVisible = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <Container>
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      {startPage > 1 && (
        <>
          <PageButton onClick={() => onPageChange(1)}>1</PageButton>
          {startPage > 2 && <Ellipsis>...</Ellipsis>}
        </>
      )}

      {pages.map((page) => (
        <PageButton
          key={page}
          active={page === currentPage}
          onClick={() => onPageChange(page)}
        >
          {page}
        </PageButton>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <Ellipsis>...</Ellipsis>}
          <PageButton onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </PageButton>
        </>
      )}

      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin: 2rem 0;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: var(--background);
  border-radius: 4px;
  color: var(--text-primary);

  &:hover:not(:disabled) {
    background: var(--surface);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageButton = styled.button`
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  background: ${(props) =>
    props.active ? "var(--primary)" : "var(--background)"};
  color: ${(props) => (props.active ? "white" : "var(--text-primary)")};
  border-radius: 4px;
  min-width: 40px;

  &:hover {
    background: ${(props) =>
      props.active ? "var(--primary-dark)" : "var(--surface)"};
  }
`;

const Ellipsis = styled.span`
  padding: 0.5rem;
  color: var(--text-secondary);
`;

export default Pagination;
