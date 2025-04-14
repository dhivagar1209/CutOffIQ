import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './app.css';
import { CachedDataProvider } from './routes/find-colleges';
import { Navbar } from './components/navbar';

// Import your pages
import HomePage from './routes/index';
import FindCollegesPage from './routes/find-colleges';
import ComparePage from './routes/compare';
import TrendsPage from './routes/trends';
import BookmarkedCollegesPage from './routes/bookmarked-colleges';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful:', registration.scope);
    }).catch(error => {
      console.log('ServiceWorker registration failed:', error);
    });
  });
}

// Render the app - React 18 style
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <CachedDataProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/find-colleges" element={<FindCollegesPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/bookmarked-colleges" element={<BookmarkedCollegesPage />} />
        </Routes>
      </Router>
    </CachedDataProvider>
  </React.StrictMode>
); 