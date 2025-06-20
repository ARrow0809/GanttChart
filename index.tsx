/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // App is at the root
import './App.css';       // App.css is at the root

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element with ID "root". Please ensure it exists in your index.html.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);