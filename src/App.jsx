import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Calculator from './pages/Calculator';
import LogAnalyzer from './pages/LogAnalyzer';
import LogViewer from './pages/LogViewer';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'system';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/analyzer" element={<LogAnalyzer />} />
          <Route path="/viewer" element={<LogViewer />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;