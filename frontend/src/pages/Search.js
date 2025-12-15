import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import SearchBar from "../components/SearchBar";
import PaperCard from "../components/PaperCard";
import Pagination from "../components/Pagination";
import { papersAPI } from "../services/api";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    sort: "relevance",
    year: "",
    venue: "",
  });

  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page")) || 1;

  useEffect(() => {
    if (query) {
      searchPapers();
    }
  }, [query, page, filters.sort]);

  const searchPapers = async () => {
    try {
      setLoading(true);
      const response = await papersAPI.search({
        q: query,
        page,
        limit: 20,
        sort: filters.sort,
        year: filters.year,
        venue: filters.venue,
      });
      setPapers(response.data.papers);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newQuery) => {
    setSearchParams({ q: newQuery, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ q: query, page: newPage });
    window.scrollTo(0, 0);
  };

  const handleSortChange = (sort) => {
    setFilters({ ...filters, sort });
  };

  return (
    <Container className="container">
      <SearchSection>
        <SearchBar onSearch={handleSearch} placeholder="Search papers..." />
      </SearchSection>

      <Content>
        <Sidebar>
          <FilterSection>
            <FilterTitle>Sort by</FilterTitle>
            <Select
              value={filters.sort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="relevance">Relevance</option>
              <option value="citations">Citations</option>
              <option value="year">Year</option>
              <option value="title">Title</option>
            </Select>
          </FilterSection>
        </Sidebar>

        <Main>
          {query && (
            <ResultsHeader>
              {loading
                ? "Searching..."
                : `Found ${pagination.total || 0} results for "${query}"`}
            </ResultsHeader>
          )}

          {loading ? (
            <Loading>Loading results...</Loading>
          ) : papers.length > 0 ? (
            <>
              <Results>
                {papers.map((paper) => (
                  <PaperCard key={paper.paper_id} paper={paper} />
                ))}
              </Results>

              {pagination.pages > 1 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : query ? (
            <NoResults>No papers found. Try different keywords.</NoResults>
          ) : (
            <NoResults>Enter a search query to find papers</NoResults>
          )}
        </Main>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  padding: 2rem 0;
  min-height: calc(100vh - 70px);
`;

const SearchSection = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  @media (max-width: 768px) {
    order: 2;
  }
`;

const FilterSection = styled.div`
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const FilterTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 0.95rem;
`;

const Main = styled.main``;

const ResultsHeader = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
`;

const Results = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Loading = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
`;

const NoResults = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  font-size: 1.1rem;
`;

export default Search;
