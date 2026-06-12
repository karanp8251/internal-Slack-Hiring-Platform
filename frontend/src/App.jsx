import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const AppContent = () => {
  const { token, login, user } = useAuth();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlUserId = params.get('userId');
    const urlRole = params.get('role');
    const urlName = params.get('name');
    const urlEmail = params.get('email');

    if (urlToken && urlUserId && urlRole && urlName && urlEmail) {
      const userData = {
        token: urlToken,
        userId: parseInt(urlUserId),
        role: urlRole,
        name: decodeURIComponent(urlName),
        email: urlEmail
      };
      login(userData, urlToken);
      // Clean parameters from history URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  if (!token || !user) {
    return <Login />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
