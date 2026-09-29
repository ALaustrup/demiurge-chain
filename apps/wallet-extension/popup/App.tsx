// Demiurge Wallet Extension - Main App Component
import React, { useEffect } from 'react';
import { useStore } from './store';
import { LoadingScreen } from './screens/LoadingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { UnlockScreen } from './screens/UnlockScreen';
import { MainScreen } from './screens/MainScreen';
import { SendScreen } from './screens/SendScreen';
import { ReceiveScreen } from './screens/ReceiveScreen';
import { ApproveScreen } from './screens/ApproveScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Header } from './components/Header';
import { Toast } from './components/Toast';

export function App() {
  const { view, initialize, error, success, clearMessages } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const renderScreen = () => {
    switch (view) {
      case 'loading':
        return <LoadingScreen />;
      case 'login':
        return <LoginScreen />;
      case 'unlock':
        return <UnlockScreen />;
      case 'main':
        return <MainScreen />;
      case 'send':
        return <SendScreen />;
      case 'receive':
        return <ReceiveScreen />;
      case 'approve':
        return <ApproveScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <LoadingScreen />;
    }
  };

  const showHeader = !['loading', 'login', 'unlock'].includes(view);

  return (
    <div className="flex flex-col min-h-[500px]">
      {showHeader && <Header />}
      <main className="flex-1 flex flex-col">
        {renderScreen()}
      </main>
      {error && (
        <Toast type="error" message={error} onClose={clearMessages} />
      )}
      {success && (
        <Toast type="success" message={success} onClose={clearMessages} />
      )}
    </div>
  );
}
