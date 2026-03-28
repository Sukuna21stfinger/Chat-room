import { useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import ChatPage from './pages/ChatPage';
import Login from './pages/Login';
import privacyAuth from './services/privacyAuth';
import { applyTheme, getStoredTheme } from './styles/theme';

const PrivateRoute = ({ children }) =>
  privacyAuth.isAuthenticated() ? children : <Navigate to="/login" />;

function App() {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <Router>
      <SocketProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;
