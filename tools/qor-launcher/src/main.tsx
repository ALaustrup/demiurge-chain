import React from 'react';
import { createRoot } from 'react-dom/client';

import './styles/qor.css';
import { App } from './App';
import { Boundary } from './components/chrome/Boundary';

const host = document.getElementById('qor-root');
if (!host) throw new Error('#qor-root is missing from index.html');

createRoot(host).render(
  <React.StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </React.StrictMode>,
);
