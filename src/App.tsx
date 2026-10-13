/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from 'next-themes';
import { supabase } from './lib/supabase';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DataPasienPage from './pages/DataPasienPage';
import LaporanPage from './pages/LaporanPage';
import MonitoringPage from './pages/MonitoringPage';
import PengaturanPage from './pages/PengaturanPage';

export default function App() {
  const { checkAuth, loading, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <WelcomePage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="data-pasien" element={<DataPasienPage />} />
            <Route path="laporan" element={<LaporanPage />} />
            <Route path="monitoring" element={<MonitoringPage />} />
            <Route path="pengaturan" element={<PengaturanPage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

