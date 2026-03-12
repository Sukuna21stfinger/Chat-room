import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import ChatPage from './pages/ChatPage';
import Login from './pages/Login';
import Register from './pages/Register';
import privacyAuth from './services/privacyAuth';
import { applyTheme, getStoredTheme } from './styles/theme';
import { useEffect } from 'react';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = privacyAuth.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  useEffect(() => {
    // Apply theme on app start
    applyTheme(getStoredTheme());
  }, []);

  return (
    <Router>
      <SocketProvider>
        <div className="App">
          <Routes>
            <Route
              path="/"
              element={
                privacyAuth.isAuthenticated() ? (
                  <Navigate to="/chat" />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/chat" 
              element={
                <PrivateRoute>
                  <ChatPage />
                </PrivateRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;