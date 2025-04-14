import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './app.css';
import { CachedDataProvider } from './routes/find-colleges';
import { Navbar } from './components/navbar';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

// Import your pages
import HomePage from './routes/index';
import FindCollegesPage from './routes/find-colleges';
import ComparePage from './routes/compare';
import TrendsPage from './routes/trends';
import BookmarkedCollegesPage from './routes/bookmarked-colleges';

// Initialize PostHog with environment variables
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

// PostHog configuration options
const posthogOptions = {
  api_host: POSTHOG_HOST,
  capture_pageview: true, // Automatically capture pageviews
  capture_pageleave: true, // Automatically capture page leave events
  loaded: (posthogInstance: typeof posthog) => {
    if (import.meta.env.DEV) {
      // Don't actually send events in development
      posthogInstance.opt_out_capturing();
    }
  }
};

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

// Create a type declaration for react-dom/client to fix TypeScript error
declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): {
    render(children: React.ReactNode): void;
  };
}

// Only render with PostHog if API key is available
const renderApp = () => {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  
  const AppContent = (
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
  );
  
  // Render with or without PostHog based on whether the key is available
  if (POSTHOG_API_KEY) {
    root.render(
      <React.StrictMode>
        <PostHogProvider apiKey={POSTHOG_API_KEY} options={posthogOptions}>
          {AppContent}
        </PostHogProvider>
      </React.StrictMode>
    );
  } else {
    console.warn('PostHog API key not found. Analytics will be disabled.');
    root.render(
      <React.StrictMode>
        {AppContent}
      </React.StrictMode>
    );
  }
};

renderApp(); 