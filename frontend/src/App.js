import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Search from "./pages/Search";
import PaperDetail from "./pages/PaperDetail";
import AuthorDetail from "./pages/AuthorDetail";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import GlobalStyle from "./styles/GlobalStyle";

function App() {
  return (
    <Router>
      <AuthProvider>
        <GlobalStyle />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/papers/:id" element={<PaperDetail />} />
          <Route path="/authors/:id" element={<AuthorDetail />} />
          <Route
            path="/library"
            element={
              <PrivateRoute>
                <Library />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/feed"
            element={
              <PrivateRoute>
                <Feed />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

export default App;
