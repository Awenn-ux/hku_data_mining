import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme as antdTheme } from 'antd';
import enUS from 'antd/locale/en_US';
import App from './App';
import './assets/styles/global.css';
import { useStore } from './store/useStore';

// Theme configuration
const ThemeWrapper = () => {
  const theme = useStore((state) => state.theme);

  return (
    <ConfigProvider
      locale={enUS}
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1B5E20',
          colorSuccess: '#2E7D32',
          colorWarning: '#B8860B',
          colorInfo: '#0288D1',
          borderRadius: 8,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        },
        components: {
          Button: {
            controlHeight: 40,
            fontSize: 14,
            fontWeight: 500,
          },
          Input: {
            controlHeight: 44,
            fontSize: 14,
          },
          Card: {
            borderRadiusLG: 16,
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeWrapper />
  </React.StrictMode>
);

