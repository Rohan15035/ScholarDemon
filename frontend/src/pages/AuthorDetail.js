import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";
import { authorsAPI, followsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PaperCard from "../components/PaperCard";

const AuthorDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [author, setAuthor] = useState(null);
  const [papers, setPapers] = useState([]);
  const [coAuthors, setCoAuthors] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthorDetails();
    fetchPapers();
    fetchCoAuthors();
    if (isAuthenticated) {
      checkFollowing();
    }
  }, [id, isAuthenticated]);

  const fetchAuthorDetails = async () => {
    try {
      const response = await authorsAPI.getById(id);
      setAuthor(response.data);
    } catch (error) {
      console.error("Error fetching author:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPapers = async () => {
    try {
      const response = await authorsAPI.getPapers(id, { limit: 20 });
      setPapers(response.data);
    } catch (error) {
      console.error("Error fetching papers:", error);
    }
  };

  const fetchCoAuthors = async () => {
    try {
      const response = await authorsAPI.getCoAuthors(id);
      setCoAuthors(response.data);
    } catch (error) {
      console.error("Error fetching co-authors:", error);
    }
  };

  const checkFollowing = async () => {
    try {
      const response = await followsAPI.checkAuthor(id);
      setIsFollowing(response.data.is_following);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await followsAPI.unfollowAuthor(id);
        setIsFollowing(false);
      } else {
        await followsAPI.followAuthor(id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert("Failed to update follow status");
    }
  };

  if (loading) return <Loading>Loading author...</Loading>;
  if (!author) return <Error>Author not found</Error>;

  return (
    <Container className="container">
      <Header>
        <Title>{author.name}</Title>

        {author.affiliation && <Affiliation>{author.affiliation}</Affiliation>}
        {author.institution_name && (
          <Institution>
            {author.institution_name}, {author.institution_country}
          </Institution>
        )}

        <Metrics>
          <Metric>
            <MetricValue>{author.h_index}</MetricValue>
            <MetricLabel>h-index</MetricLabel>
          </Metric>
          <Metric>
            <MetricValue>{author.citation_count}</MetricValue>
            <MetricLabel>Citations</MetricLabel>
          </Metric>
          <Metric>
            <MetricValue>{papers.length}</MetricValue>
            <MetricLabel>Papers</MetricLabel>
          </Metric>
        </Metrics>

        {author.research_areas && author.research_areas.length > 0 && (
          <ResearchAreas>
            <strong>Research Areas:</strong>{" "}
            {author.research_areas.filter((a) => a).join(", ")}
          </ResearchAreas>
        )}

        {isAuthenticated && (
          <FollowButton onClick={handleFollow} following={isFollowing}>
            {isFollowing ? "Unfollow" : "Follow"}
          </FollowButton>
        )}
      </Header>

      <Content>
        <Main>
          <Section>
            <SectionTitle>Publications ({papers.length})</SectionTitle>
            <PaperList>
              {papers.map((paper) => (
                <PaperCard key={paper.paper_id} paper={paper} />
              ))}
            </PaperList>
          </Section>
        </Main>

        <Sidebar>
          {coAuthors.length > 0 && (
            <Section>
              <SectionTitle>Frequent Co-authors</SectionTitle>
              <CoAuthorList>
                {coAuthors.slice(0, 10).map((coAuthor) => (
                  <CoAuthor key={coAuthor.author_id}>
                    <Link to={`/authors/${coAuthor.author_id}`}>
                      {coAuthor.name}
                    </Link>
                    <CoAuthorMeta>
                      {coAuthor.collaboration_count} papers together
                    </CoAuthorMeta>
                  </CoAuthor>
                ))}
              </CoAuthorList>
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
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const Affiliation = styled.div`
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
`;

const Institution = styled.div`
  color: var(--text-secondary);
  margin-bottom: 1rem;
`;

const Metrics = styled.div`
  display: flex;
  gap: 3rem;
  margin: 1.5rem 0;
`;

const Metric = styled.div`
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 500;
  color: var(--primary);
`;

const MetricLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const ResearchAreas = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background: var(--surface);
  border-radius: 4px;
`;

const FollowButton = styled.button`
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: ${(props) => (props.following ? "white" : "var(--primary)")};
  color: ${(props) => (props.following ? "var(--text-primary)" : "white")};
  border: 1px solid
    ${(props) => (props.following ? "var(--border)" : "var(--primary)")};
  border-radius: 4px;

  &:hover {
    background: ${(props) =>
      props.following ? "var(--surface)" : "var(--primary-dark)"};
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
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
`;

const PaperList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CoAuthorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CoAuthor = styled.div`
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
  }

  a {
    color: var(--primary);
    font-weight: 500;
  }
`;

const CoAuthorMeta = styled.div`
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-top: 0.25rem;
`;

export default AuthorDetail;
