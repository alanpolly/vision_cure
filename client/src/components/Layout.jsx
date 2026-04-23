import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopAppBar from './TopAppBar';
import BottomNavBar from './BottomNavBar';
import HoldToTalkButton from './HoldToTalkButton';
import { useAccessibility } from '../context/AccessibilityContext';

function Layout() {
  const location = useLocation();
  const { voiceGuidance, speak } = useAccessibility();

  // Hide TopAppBar on SCAN page as the scan page is full screen/immersive
  const hideTopNav = location.pathname === '/scan';
  
  // Also hide standard bars on LANDING page as it has its own custom UI
  const isLanding = location.pathname === '/';

  // Announce page navigation via voice guidance
  useEffect(() => {
    if (voiceGuidance) {
      const pageNames = {
        '/dashboard': 'Home Dashboard',
        '/scan': 'Scan Medicine',
        '/medications': 'Medications List',
        '/profile': 'Profile Settings',
        '/login': 'Login Page',
      };
      const pageName = pageNames[location.pathname] || 'Page';
      speak(`Navigated to ${pageName}`);
    }
  }, [location.pathname, voiceGuidance, speak]);

  if (isLanding) {
    return <Outlet />;
  }

  return (
    <div className="vc-app-body min-h-screen flex flex-col">
      {/* Decorative blurred blobs for visual depth across the app */}
      <div className="vc-blob w-[400px] h-[400px] top-[-100px] right-[5%]" style={{ background: 'radial-gradient(circle, #c7d2fe 0%, transparent 70%)' }}></div>
      <div className="vc-blob w-[300px] h-[300px] bottom-[10%] left-[5%]" style={{ background: 'radial-gradient(circle, #ddd6fe 0%, transparent 70%)' }}></div>
      
      {!hideTopNav && <TopAppBar />}
      
      <main className={`flex-1 ${hideTopNav ? '' : 'pt-28'} pb-36 max-w-5xl mx-auto w-full px-4 md:px-8 relative z-10`}>
        <Outlet />
      </main>

      <BottomNavBar />
      <HoldToTalkButton />
    </div>
  );
}

export default Layout;
