import React from 'react';
import { NavLink } from 'react-router-dom';

function BottomNavBar() {
  // Styles for the active state — matches the indigo/violet theme
  const activeClass = "flex items-center gap-2 bg-[#4f46e5] text-white rounded-2xl px-5 py-2.5 transition-all duration-300 shadow-md shadow-indigo-100 scale-105";
  
  // Styles for inactive state
  const inactiveClass = "flex items-center gap-2 text-slate-400 hover:text-slate-600 px-4 py-2.5 transition-all duration-200 active:scale-95";

  const getLinkClass = (isActive) => isActive ? activeClass : inactiveClass;

  const NavItem = ({ to, icon, label }) => (
    <NavLink to={to} className={({ isActive }) => getLinkClass(isActive)}>
      <span className="material-symbols-outlined text-[1.4rem]" style={{fontVariationSettings: "'FILL' 1"}}>{icon}</span>
      <span className="font-bold text-[0.85rem] tracking-tight">{label}</span>
    </NavLink>
  );

  return (
    <nav className="fixed bottom-6 left-0 w-full z-50 px-4">
      <div className="max-w-lg mx-auto flex justify-around items-center p-3 vc-glass rounded-[28px] shadow-lg border border-white/50">
        <NavItem to="/dashboard" icon="home" label="Home" />
        <NavItem to="/scan" icon="qr_code_scanner" label="Scan" />
        <NavItem to="/medications" icon="medication" label="Meds" />
        <NavItem to="/profile" icon="person" label="Me" />
      </div>
    </nav>
  );
}

export default BottomNavBar;
