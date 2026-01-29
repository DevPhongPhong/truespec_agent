// ============================================================================
// MAIN LAYOUT COMPONENT - App shell with TopBar
// ============================================================================

import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import styles from './MainLayout.module.css';

export const MainLayout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <div className="bg-glow" />
      <div className="bg-noise" />
      
      <TopBar />
      
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

