
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ChatPage from './pages/ChatPage';
import { Toaster } from './components/ui/toaster';
import { useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebase/config';
import './App.css';

const App = () => {
  // Initialize Firebase on component mount
  useEffect(() => {
    initializeApp(firebaseConfig);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<ChatPage />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
};

export default App;
