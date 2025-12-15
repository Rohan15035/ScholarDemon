-- ScholarDemon Database Schema
-- Drop existing views first (they depend on tables)
DROP VIEW IF EXISTS author_profiles;
DROP VIEW IF EXISTS paper_details;

-- Drop existing tables (for clean migration)
DROP TABLE IF EXISTS search_history;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS user_follows_venues;
DROP TABLE IF EXISTS user_follows_authors;
DROP TABLE IF EXISTS user_library;
DROP TABLE IF EXISTS citations;
DROP TABLE IF EXISTS paper_research_areas;
DROP TABLE IF EXISTS author_research_areas;
DROP TABLE IF EXISTS paper_keywords;
DROP TABLE IF EXISTS paper_authors;
DROP TABLE IF EXISTS research_areas;
DROP TABLE IF EXISTS keywords;
DROP TABLE IF EXISTS papers;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS authors;
DROP TABLE IF EXISTS institutions;
DROP TABLE IF EXISTS users;

-- Create tables
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'author', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE institutions (
    institution_id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    country VARCHAR(100),
    website VARCHAR(500),
    type VARCHAR(100) CHECK (type IN ('university', 'research_lab', 'company', 'government', 'other'))
);

CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    affiliation VARCHAR(500),
    email VARCHAR(255),
    orcid_id VARCHAR(19) UNIQUE,
    research_interests TEXT,
    h_index INTEGER DEFAULT 0 CHECK (h_index >= 0),
    citation_count INTEGER DEFAULT 0 CHECK (citation_count >= 0),
    institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE SET NULL
);

CREATE TABLE venues (
    venue_id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    short_name VARCHAR(50),
    type VARCHAR(50) CHECK (type IN ('journal', 'conference', 'workshop', 'book_series', 'preprint')),
    publisher VARCHAR(255),
    impact_factor DECIMAL(5,3) CHECK (impact_factor >= 0),
    issn_or_isbn VARCHAR(20)
);

CREATE TABLE papers (
    paper_id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    abstract TEXT,
    year INTEGER CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    doi VARCHAR(255) UNIQUE,
    pdf_url TEXT,
    full_text TEXT,
    venue_id INTEGER REFERENCES venues(venue_id) ON DELETE SET NULL,
    volume VARCHAR(50),
    issue VARCHAR(50),
    pages VARCHAR(50),
    citation_count INTEGER DEFAULT 0 CHECK (citation_count >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE keywords (
    keyword_id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE research_areas (
    area_id SERIAL PRIMARY KEY,
    area_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE paper_authors (
    paper_id INTEGER REFERENCES papers(paper_id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES authors(author_id) ON DELETE CASCADE,
    author_order INTEGER NOT NULL CHECK (author_order > 0),
    PRIMARY KEY (paper_id, author_id)
);

CREATE TABLE paper_keywords (
    paper_id INTEGER REFERENCES papers(paper_id) ON DELETE CASCADE,
    keyword_id INTEGER REFERENCES keywords(keyword_id) ON DELETE CASCADE,
    PRIMARY KEY (paper_id, keyword_id)
);

CREATE TABLE author_research_areas (
    author_id INTEGER REFERENCES authors(author_id) ON DELETE CASCADE,
    area_id INTEGER REFERENCES research_areas(area_id) ON DELETE CASCADE,
    PRIMARY KEY (author_id, area_id)
);

CREATE TABLE paper_research_areas (
    paper_id INTEGER REFERENCES papers(paper_id) ON DELETE CASCADE,
    area_id INTEGER REFERENCES research_areas(area_id) ON DELETE CASCADE,
    PRIMARY KEY (paper_id, area_id)
);

CREATE TABLE citations (
    citing_paper_id INTEGER REFERENCES papers(paper_id) ON DELETE CASCADE,
    cited_paper_id INTEGER REFERENCES papers(paper_id) ON DELETE CASCADE,
    citation_context TEXT,
    PRIMARY KEY (citing_paper_id, cited_paper_id),
    CHECK (citing_paper_id != cited_paper_id)
);

CREATE TABLE user_library (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    paper_id INTEGER REFERENCES papers(paper_id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    PRIMARY KEY (user_id, paper_id)
);

CREATE TABLE user_follows_authors (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES authors(author_id) ON DELETE CASCADE,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, author_id)
);

CREATE TABLE user_follows_venues (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    venue_id INTEGER REFERENCES venues(venue_id) ON DELETE CASCADE,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, venue_id)
);

CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    paper_id INTEGER REFERENCES papers(paper_id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent_comment_id INTEGER REFERENCES comments(comment_id) ON DELETE CASCADE
);

CREATE TABLE search_history (
    history_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_authors_name ON authors(name);
CREATE INDEX idx_authors_institution ON authors(institution_id);
CREATE INDEX idx_authors_orcid ON authors(orcid_id);
CREATE INDEX idx_papers_title ON papers(title);
CREATE INDEX idx_papers_year ON papers(year);
CREATE INDEX idx_papers_venue ON papers(venue_id);
CREATE INDEX idx_papers_doi ON papers(doi);
CREATE INDEX idx_papers_citation_count ON papers(citation_count DESC);
CREATE INDEX idx_keywords_keyword ON keywords(keyword);
CREATE INDEX idx_paper_authors_paper ON paper_authors(paper_id);
CREATE INDEX idx_paper_authors_author ON paper_authors(author_id);
CREATE INDEX idx_citations_citing ON citations(citing_paper_id);
CREATE INDEX idx_citations_cited ON citations(cited_paper_id);
CREATE INDEX idx_user_library_user ON user_library(user_id);
CREATE INDEX idx_user_library_paper ON user_library(paper_id);
CREATE INDEX idx_comments_paper ON comments(paper_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_search_history_user ON search_history(user_id);

-- Full-text search indexes (PostgreSQL GIN indexes)
CREATE INDEX idx_papers_title_trgm ON papers USING gin(to_tsvector('english', title));
CREATE INDEX idx_papers_abstract_trgm ON papers USING gin(to_tsvector('english', abstract));

-- Create trigger to update paper citation counts
CREATE OR REPLACE FUNCTION update_paper_citation_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE papers SET citation_count = citation_count + 1 WHERE paper_id = NEW.cited_paper_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE papers SET citation_count = citation_count - 1 WHERE paper_id = OLD.cited_paper_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER citation_count_trigger
AFTER INSERT OR DELETE ON citations
FOR EACH ROW EXECUTE FUNCTION update_paper_citation_count();

-- Create trigger to update author citation counts and h-index
CREATE OR REPLACE FUNCTION update_author_metrics()
RETURNS TRIGGER AS $$
DECLARE
    author_rec RECORD;
    h INTEGER;
    cited_paper INTEGER;
    citing_paper INTEGER;
BEGIN
    -- Get paper IDs from the citation
    IF TG_OP = 'INSERT' THEN
        cited_paper := NEW.cited_paper_id;
        citing_paper := NEW.citing_paper_id;
    ELSIF TG_OP = 'DELETE' THEN
        cited_paper := OLD.cited_paper_id;
        citing_paper := OLD.citing_paper_id;
    END IF;
    
    -- Update citation counts for all authors of both papers
    FOR author_rec IN 
        SELECT DISTINCT author_id FROM paper_authors 
        WHERE paper_id = cited_paper OR paper_id = citing_paper
    LOOP
        -- Update total citation count
        UPDATE authors 
        SET citation_count = (
            SELECT COALESCE(SUM(p.citation_count), 0)
            FROM papers p
            JOIN paper_authors pa ON p.paper_id = pa.paper_id
            WHERE pa.author_id = author_rec.author_id
        )
        WHERE author_id = author_rec.author_id;
        
        -- Calculate and update h-index
        SELECT COUNT(*) INTO h
        FROM (
            SELECT p.citation_count
            FROM papers p
            JOIN paper_authors pa ON p.paper_id = pa.paper_id
            WHERE pa.author_id = author_rec.author_id
            ORDER BY p.citation_count DESC
        ) AS citations
        WHERE citation_count >= (
            SELECT COUNT(*) 
            FROM (
                SELECT p2.citation_count
                FROM papers p2
                JOIN paper_authors pa2 ON p2.paper_id = pa2.paper_id
                WHERE pa2.author_id = author_rec.author_id
                ORDER BY p2.citation_count DESC
            ) AS c2
            WHERE c2.citation_count >= citations.citation_count
        );
        
        UPDATE authors SET h_index = COALESCE(h, 0) WHERE author_id = author_rec.author_id;
    END LOOP;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER author_metrics_trigger
AFTER INSERT OR DELETE ON citations
FOR EACH ROW EXECUTE FUNCTION update_author_metrics();

-- Create trigger to update papers.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_papers_updated_at
BEFORE UPDATE ON papers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for paper details with all related information
CREATE OR REPLACE VIEW paper_details AS
SELECT 
    p.paper_id,
    p.title,
    p.abstract,
    p.year,
    p.doi,
    p.pdf_url,
    p.citation_count,
    v.name AS venue_name,
    v.type AS venue_type,
    (SELECT ARRAY_AGG(a2.name ORDER BY pa2.author_order)
     FROM paper_authors pa2
     JOIN authors a2 ON pa2.author_id = a2.author_id
     WHERE pa2.paper_id = p.paper_id) AS authors,
    ARRAY_AGG(DISTINCT k.keyword) FILTER (WHERE k.keyword IS NOT NULL) AS keywords,
    ARRAY_AGG(DISTINCT ra.area_name) FILTER (WHERE ra.area_name IS NOT NULL) AS research_areas
FROM papers p
LEFT JOIN venues v ON p.venue_id = v.venue_id
LEFT JOIN paper_keywords pk ON p.paper_id = pk.paper_id
LEFT JOIN keywords k ON pk.keyword_id = k.keyword_id
LEFT JOIN paper_research_areas pra ON p.paper_id = pra.paper_id
LEFT JOIN research_areas ra ON pra.area_id = ra.area_id
GROUP BY p.paper_id, v.name, v.type;

-- Create view for author profiles with metrics
CREATE OR REPLACE VIEW author_profiles AS
SELECT 
    a.author_id,
    a.name,
    a.affiliation,
    a.email,
    a.orcid_id,
    a.h_index,
    a.citation_count,
    i.name AS institution_name,
    i.country AS institution_country,
    ARRAY_AGG(DISTINCT ra.area_name) AS research_areas,
    COUNT(DISTINCT pa.paper_id) AS paper_count
FROM authors a
LEFT JOIN institutions i ON a.institution_id = i.institution_id
LEFT JOIN author_research_areas ara ON a.author_id = ara.author_id
LEFT JOIN research_areas ra ON ara.area_id = ra.area_id
LEFT JOIN paper_authors pa ON a.author_id = pa.author_id
GROUP BY a.author_id, i.name, i.country;

COMMENT ON TABLE users IS 'Registered users of the system';
COMMENT ON TABLE institutions IS 'Academic and research institutions';
COMMENT ON TABLE authors IS 'Academic authors and researchers';
COMMENT ON TABLE venues IS 'Publication venues (journals, conferences, etc.)';
COMMENT ON TABLE papers IS 'Academic papers and publications';
COMMENT ON TABLE keywords IS 'Keywords for tagging papers';
COMMENT ON TABLE research_areas IS 'Broad research areas and fields';
COMMENT ON TABLE citations IS 'Citation relationships between papers';
COMMENT ON TABLE user_library IS 'Users personal paper libraries';
COMMENT ON TABLE comments IS 'User comments on papers (threaded)';
