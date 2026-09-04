import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AtlasThemeProvider } from '@atlas/core';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AtlasThemeProvider>
      <App />
    </AtlasThemeProvider>
  </StrictMode>,
);
