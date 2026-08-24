import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ActiveFastProvider } from './contexts/ActiveFastContext';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <ActiveFastProvider>
        <RootNavigator />
      </ActiveFastProvider>
    </ThemeProvider>
  );
}
