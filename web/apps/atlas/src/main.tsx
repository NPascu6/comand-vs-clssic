import React from 'react';
import { createRoot } from 'react-dom/client';
import { AtlasThemeProvider, ToastProvider } from '@atlas/core';
import { loadRuntimeConfig } from '@atlas/platform';
import { I18nProvider } from '@atlas/i18n';
import './index.css';
import { App } from './App';

// The environment's config (/config.json) is read once, before anything renders.
async function boot() {
  const config = await loadRuntimeConfig();
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AtlasThemeProvider>
        <ToastProvider>
          <I18nProvider apiBaseUrl={config.apiBaseUrl}>
            <App config={config} />
          </I18nProvider>
        </ToastProvider>
      </AtlasThemeProvider>
    </React.StrictMode>,
  );
}

void boot();
