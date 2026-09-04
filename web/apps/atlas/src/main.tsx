import React from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_API_BASE } from '@atlas/platform';
import { I18nProvider } from '@atlas/i18n';
import '@atlas/core/styles/tokens.css';
import './index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Translations are served by the backend; the switcher lists whatever it offers. */}
    <I18nProvider apiBaseUrl={DEFAULT_API_BASE}>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
