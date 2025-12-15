import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const PaperCard = ({ paper }) => {
  return (
    <Card>
      <Title to={`/papers/${paper.paper_id}`}>{paper.title}</Title>

      <Authors>
        {Array.isArray(paper.authors) && paper.authors.length > 0 ? (
          paper.authors.map((author, index) => (
            <span key={index}>
              {typeof author === "string" ? author : author.name}
              {index < paper.authors.length - 1 ? ", " : ""}
            </span>
          ))
        ) : (
          <span>Unknown Authors</span>
        )}
      </Authors>

      <Metadata>
        {paper.year && <Year>{paper.year}</Year>}
        {paper.venue_name && <Venue>{paper.venue_name}</Venue>}
        <Citations>{paper.citation_count || 0} citations</Citations>
      </Metadata>

      {paper.abstract && (
        <Abstract>
          {paper.abstract.substring(0, 300)}
          {paper.abstract.length > 300 ? "..." : ""}
        </Abstract>
      )}

      {paper.keywords && Array.isArray(paper.keywords) && (
        <Keywords>
          {paper.keywords
            .filter((k) => k)
            .slice(0, 5)
            .map((keyword, index) => (
              <Keyword key={index}>{keyword}</Keyword>
            ))}
        </Keywords>
      )}
    </Card>
  );
};

const Card = styled.div`
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px var(--shadow);
  }
`;

const Title = styled(Link)`
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--primary);
  display: block;
  margin-bottom: 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;

const Authors = styled.div`
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
`;

const Metadata = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
`;

const Year = styled.span`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const Venue = styled.span`
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-style: italic;
`;

const Citations = styled.span`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const Abstract = styled.p`
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
`;

const Keywords = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Keyword = styled.span`
  background: var(--surface);
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

export default PaperCard;
