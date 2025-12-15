import React, { useState, useEffect } from "react";
import styled from "styled-components";
import PaperCard from "../components/PaperCard";
import { followsAPI } from "../services/api";

const Feed = () => {
  const [feed, setFeed] = useState([]);
  const [followedAuthors, setFollowedAuthors] = useState([]);
  const [followedVenues, setFollowedVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
    fetchFollows();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const response = await followsAPI.getFeed({ limit: 20 });
      setFeed(response.data);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollows = async () => {
    try {
      const [authorsRes, venuesRes] = await Promise.all([
        followsAPI.getFollowedAuthors(),
        followsAPI.getFollowedVenues(),
      ]);
      setFollowedAuthors(authorsRes.data);
      setFollowedVenues(venuesRes.data);
    } catch (error) {
      console.error("Error fetching follows:", error);
    }
  };

  return (
    <Container className="wide-container">
      <Content>
        <Main>
          <Header>
            <Title>Your Feed</Title>
            <Subtitle>Papers from authors and venues you follow</Subtitle>
          </Header>

          {loading ? (
            <Loading>Loading feed...</Loading>
          ) : feed.length > 0 ? (
            <FeedList>
              {feed.map((paper) => (
                <FeedItem key={paper.paper_id}>
                  <FeedType>
                    {paper.follow_type === "author"
                      ? "👤 From followed author"
                      : "📚 From followed venue"}
                  </FeedType>
                  <PaperCard paper={paper} />
                </FeedItem>
              ))}
            </FeedList>
          ) : (
            <Empty>
              <p>Your feed is empty</p>
              <p>Follow authors and venues to see their latest papers here!</p>
            </Empty>
          )}
        </Main>

        <Sidebar>
          <Section>
            <SectionTitle>
              Following ({followedAuthors.length} authors)
            </SectionTitle>
            <FollowList>
              {followedAuthors.slice(0, 5).map((author) => (
                <FollowItem key={author.author_id}>
                  <FollowName>{author.name}</FollowName>
                  <FollowMeta>{author.paper_count} papers</FollowMeta>
                </FollowItem>
              ))}
            </FollowList>
          </Section>

          <Section>
            <SectionTitle>
              Following ({followedVenues.length} venues)
            </SectionTitle>
            <FollowList>
              {followedVenues.slice(0, 5).map((venue) => (
                <FollowItem key={venue.venue_id}>
                  <FollowName>{venue.short_name || venue.name}</FollowName>
                  <FollowMeta>{venue.paper_count} papers</FollowMeta>
                </FollowItem>
              ))}
            </FollowList>
          </Section>
        </Sidebar>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  padding: 2rem 0;
  min-height: calc(100vh - 70px);
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const Main = styled.main``;

const Sidebar = styled.aside``;

const Header = styled.header`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1.1rem;
`;

const FeedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const FeedItem = styled.div``;

const FeedType = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const Loading = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
`;

const Empty = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);

  p:first-child {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`;

const Section = styled.section`
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  margin-bottom: 1rem;
`;

const FollowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FollowItem = styled.div`
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const FollowName = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const FollowMeta = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

export default Feed;
