
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Remove loader once React has started rendering
  const loader = document.getElementById('loading-screen');
  if (loader) {
    // Small delay to ensure the first frame is painted
    requestAnimationFrame(() => {
      setTimeout(() => {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.3s ease';
        setTimeout(() => loader.remove(), 300);
      }, 500);
    });
  }
} else {
  console.error("Fatal: Root element not found");
}
