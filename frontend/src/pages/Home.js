import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import SearchBar from "../components/SearchBar";
import PaperCard from "../components/PaperCard";
import { papersAPI } from "../services/api";

const Home = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const response = await papersAPI.getAll({ sort: "citations", limit: 10 });
      setPapers(response.data.papers);
    } catch (error) {
      console.error("Error fetching papers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <Container>
      <Hero>
        <HeroContent className="container">
          <Title>ScholarDemon</Title>
          <Subtitle>Discover, organize, and explore academic research</Subtitle>
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search for papers, authors, topics..."
          />
        </HeroContent>
      </Hero>

      <Content className="container">
        <Section>
          <SectionTitle>Top Cited Papers</SectionTitle>
          {loading ? (
            <Loading>Loading papers...</Loading>
          ) : (
            <PaperList>
              {papers.map((paper) => (
                <PaperCard key={paper.paper_id} paper={paper} />
              ))}
            </PaperList>
          )}
        </Section>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  min-height: calc(100vh - 70px);
`;

const Hero = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4rem 0;
  text-align: center;
`;

const HeroContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  margin: 0;
  opacity: 0.9;
`;

const Content = styled.div`
  padding: 3rem 0;
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
`;

const PaperList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
`;

export default Home;
