import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Inter, the typeface used in the Figma file, self-hosted (font-display: swap, only the
// character sets a page actually uses are downloaded).
import '@fontsource-variable/inter';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
