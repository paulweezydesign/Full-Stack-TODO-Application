import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Scraper from './pages/Scraper';
import KnowledgeBase from './pages/KnowledgeBase';
import Chat from './pages/Chat';
import Jobs from './pages/Jobs';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scraper" element={<Scraper />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/jobs" element={<Jobs />} />
          </Routes>
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;