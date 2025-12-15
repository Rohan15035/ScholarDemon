import React, { useState, useEffect } from "react";
import styled from "styled-components";
import PaperCard from "../components/PaperCard";
import Pagination from "../components/Pagination";
import { libraryAPI } from "../services/api";

const Library = () => {
  const [papers, setPapers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLibrary();
    fetchStats();
  }, [page, sortBy]);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      const response = await libraryAPI.getAll({
        page,
        limit: 20,
        sort: sortBy,
      });
      setPapers(response.data.papers);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching library:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await libraryAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <Container className="container">
      <Header>
        <Title>My Library</Title>
        <Stats>
          <Stat>
            <StatValue>{stats.total_papers || 0}</StatValue>
            <StatLabel>Papers</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{stats.rated_papers || 0}</StatValue>
            <StatLabel>Rated</StatLabel>
          </Stat>
          <Stat>
            <StatValue>
              {stats.average_rating ? stats.average_rating.toFixed(1) : "0"}
            </StatValue>
            <StatLabel>Avg Rating</StatLabel>
          </Stat>
        </Stats>
      </Header>

      <Controls>
        <SortSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="recent">Recently Added</option>
          <option value="rating">Highest Rated</option>
          <option value="title">Title</option>
          <option value="year">Year</option>
        </SortSelect>
      </Controls>

      {loading ? (
        <Loading>Loading library...</Loading>
      ) : papers.length > 0 ? (
        <>
          <PaperList>
            {papers.map((paper) => (
              <LibraryItem key={paper.paper_id}>
                <PaperCard paper={paper} />
                {(paper.user_notes || paper.rating) && (
                  <UserData>
                    {paper.rating && (
                      <Rating>
                        {"★".repeat(paper.rating)}
                        {"☆".repeat(5 - paper.rating)}
                      </Rating>
                    )}
                    {paper.user_notes && (
                      <Notes>
                        <strong>My notes:</strong> {paper.user_notes}
                      </Notes>
                    )}
                  </UserData>
                )}
              </LibraryItem>
            ))}
          </PaperList>

          {pagination.pages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <Empty>
          <p>Your library is empty</p>
          <p>Start adding papers you want to read or reference!</p>
        </Empty>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 2rem 0;
  min-height: calc(100vh - 70px);
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
  margin-bottom: 1.5rem;
`;

const Stats = styled.div`
  display: flex;
  gap: 3rem;
`;

const Stat = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 500;
  color: var(--primary);
`;

const StatLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const Controls = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
`;

const SortSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 1rem;
`;

const PaperList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const LibraryItem = styled.div`
  position: relative;
`;

const UserData = styled.div`
  margin-top: 0.5rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: 4px;
`;

const Rating = styled.div`
  color: #fbbf24;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

const Notes = styled.div`
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1.6;
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

export default Library;
