import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --primary: #1a73e8;
    --primary-dark: #1557b0;
    --secondary: #34a853;
    --danger: #ea4335;
    --warning: #fbbc04;
    --text-primary: #202124;
    --text-secondary: #5f6368;
    --background: #ffffff;
    --surface: #f8f9fa;
    --border: #dadce0;
    --shadow: rgba(0, 0, 0, 0.1);
  }

  body {
    font-family: 'Roboto', 'Segoe UI', 'Arial', sans-serif;
    line-height: 1.6;
    color: var(--text-primary);
    background-color: var(--background);
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 500;
    margin-bottom: 1rem;
  }

  a {
    color: var(--primary);
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: var(--primary-dark);
      text-decoration: underline;
    }
  }

  button {
    cursor: pointer;
    font-family: inherit;
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .wide-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;
  }

  @media (max-width: 768px) {
    .container, .wide-container {
      padding: 0 15px;
    }
  }
`;

export default GlobalStyle;
