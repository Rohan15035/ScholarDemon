import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";
import { papersAPI, libraryAPI, commentsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const PaperDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [paper, setPaper] = useState(null);
  const [citations, setCitations] = useState([]);
  const [comments, setComments] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [inLibrary, setInLibrary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetchPaperDetails();
    fetchCitations();
    fetchComments();
    fetchRecommendations();
    if (isAuthenticated) {
      checkLibrary();
    }
  }, [id, isAuthenticated]);

  const fetchPaperDetails = async () => {
    try {
      const response = await papersAPI.getById(id);
      setPaper(response.data);
    } catch (error) {
      console.error("Error fetching paper:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCitations = async () => {
    try {
      const response = await papersAPI.getCitations(id, "citing");
      setCitations(response.data.citations);
    } catch (error) {
      console.error("Error fetching citations:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentsAPI.getByPaper(id);
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await papersAPI.getRecommendations(id, 5);
      setRecommendations(response.data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  const checkLibrary = async () => {
    try {
      const response = await libraryAPI.check(id);
      setInLibrary(response.data.in_library);
    } catch (error) {
      console.error("Error checking library:", error);
    }
  };

  const handleAddToLibrary = async () => {
    try {
      await libraryAPI.add({ paper_id: id });
      setInLibrary(true);
      alert("Added to library!");
    } catch (error) {
      console.error("Error adding to library:", error);
      alert("Failed to add to library");
    }
  };

  const handleRemoveFromLibrary = async () => {
    try {
      await libraryAPI.remove(id);
      setInLibrary(false);
      alert("Removed from library");
    } catch (error) {
      console.error("Error removing from library:", error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await commentsAPI.create({
        paper_id: id,
        comment_text: commentText,
      });
      setCommentText("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    }
  };

  if (loading) return <Loading>Loading paper...</Loading>;
  if (!paper) return <Error>Paper not found</Error>;

  return (
    <Container className="container">
      <Header>
        <Title>{paper.title}</Title>

        <Authors>
          {paper.authors?.map((author, index) => (
            <span key={index}>
              {typeof author === "string" ? author : author.name}
              {index < paper.authors.length - 1 ? ", " : ""}
            </span>
          ))}
        </Authors>

        <Metadata>
          {paper.year && <span>{paper.year}</span>}
          {paper.venue_name && <span>{paper.venue_name}</span>}
          <span>{paper.citation_count} citations</span>
        </Metadata>

        <Actions>
          {paper.pdf_url && (
            <ActionButton href={paper.pdf_url} target="_blank">
              View PDF
            </ActionButton>
          )}
          {isAuthenticated &&
            (inLibrary ? (
              <ActionButton onClick={handleRemoveFromLibrary}>
                Remove from Library
              </ActionButton>
            ) : (
              <ActionButton primary onClick={handleAddToLibrary}>
                Add to Library
              </ActionButton>
            ))}
        </Actions>
      </Header>

      <Content>
        <Main>
          <Section>
            <SectionTitle>Abstract</SectionTitle>
            <Abstract>{paper.abstract || "No abstract available"}</Abstract>
          </Section>

          {paper.keywords && paper.keywords.length > 0 && (
            <Section>
              <SectionTitle>Keywords</SectionTitle>
              <Keywords>
                {paper.keywords
                  .filter((k) => k)
                  .map((keyword, index) => (
                    <Keyword key={index}>{keyword}</Keyword>
                  ))}
              </Keywords>
            </Section>
          )}

          <Section>
            <SectionTitle>Comments ({comments.length})</SectionTitle>

            {isAuthenticated && (
              <CommentForm onSubmit={handleAddComment}>
                <CommentInput
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows="3"
                />
                <SubmitButton type="submit">Post Comment</SubmitButton>
              </CommentForm>
            )}

            <CommentList>
              {comments.map((comment) => (
                <Comment key={comment.comment_id} depth={comment.depth || 0}>
                  <CommentAuthor>{comment.user_name}</CommentAuthor>
                  <CommentText>{comment.comment_text}</CommentText>
                  <CommentDate>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </CommentDate>
                </Comment>
              ))}
            </CommentList>
          </Section>
        </Main>

        <Sidebar>
          <Section>
            <SectionTitle>Cited by ({citations.length})</SectionTitle>
            <CitationList>
              {citations.slice(0, 5).map((citation) => (
                <Citation key={citation.paper_id}>
                  <Link to={`/papers/${citation.paper_id}`}>
                    {citation.title}
                  </Link>
                  <CitationMeta>{citation.year}</CitationMeta>
                </Citation>
              ))}
            </CitationList>
          </Section>

          {recommendations.length > 0 && (
            <Section>
              <SectionTitle>Related Papers</SectionTitle>
              <CitationList>
                {recommendations.map((rec) => (
                  <Citation key={rec.paper_id}>
                    <Link to={`/papers/${rec.paper_id}`}>{rec.title}</Link>
                  </Citation>
                ))}
              </CitationList>
            </Section>
          )}
        </Sidebar>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  padding: 2rem 0;
`;

const Loading = styled.div`
  text-align: center;
  padding: 3rem;
`;

const Error = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--danger);
`;

const Header = styled.header`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const Authors = styled.div`
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
`;

const Metadata = styled.div`
  display: flex;
  gap: 1rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--border);
  background: ${(props) => (props.primary ? "var(--primary)" : "white")};
  color: ${(props) => (props.primary ? "white" : "var(--text-primary)")};
  border-radius: 4px;
  text-decoration: none;
  display: inline-block;

  &:hover {
    background: ${(props) =>
      props.primary ? "var(--primary-dark)" : "var(--surface)"};
  }
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const Main = styled.main``;

const Sidebar = styled.aside``;

const Section = styled.section`
  margin-bottom: 2rem;
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 1rem;
`;

const Abstract = styled.p`
  line-height: 1.8;
  color: var(--text-primary);
`;

const Keywords = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Keyword = styled.span`
  background: var(--surface);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const CommentForm = styled.form`
  margin-bottom: 1.5rem;
`;

const CommentInput = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  margin-bottom: 0.5rem;
  resize: vertical;
`;

const SubmitButton = styled.button`
  padding: 0.5rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;

  &:hover {
    background: var(--primary-dark);
  }
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Comment = styled.div`
  padding: 1rem;
  background: var(--surface);
  border-radius: 4px;
  margin-left: ${(props) => props.depth * 1}rem;
`;

const CommentAuthor = styled.div`
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const CommentText = styled.p`
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

const CommentDate = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

const CitationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Citation = styled.div`
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
  }

  a {
    color: var(--primary);
    font-size: 0.95rem;
  }
`;

const CitationMeta = styled.div`
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-top: 0.25rem;
`;

export default PaperDetail;
