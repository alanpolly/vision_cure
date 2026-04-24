import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DashHeader from './dashboard/DashHeader';
import DashBottomNav from './dashboard/DashBottomNav';
import DashVoiceMic from './dashboard/DashVoiceMic';
import FlickerBackground from './dashboard/FlickerBackground';
import { DashboardProvider } from '../context/DashboardContext';

function Layout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  if (isLanding) {
    return <Outlet />;
  }

  return (
    <DashboardProvider>
      {/* Ambient mesh background */}
      <div className="app-bg"/>
      <FlickerBackground />

      <div className="shell">
        <DashHeader />
        <Outlet />
      </div>

      <DashBottomNav />
      <DashVoiceMic />
    </DashboardProvider>
  );
}

export default Layout;
