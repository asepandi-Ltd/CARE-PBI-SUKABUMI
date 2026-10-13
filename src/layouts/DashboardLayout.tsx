import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  FileText, 
  Activity, 
  Settings,
  LogOut,
  Moon,
  Sun,
  Database,
  Wifi,
  WifiOff,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'motion/react';

export default function DashboardLayout() {
  const { profile, signOut } = useAuthStore();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'local'>('checking');
  const [dbError, setDbError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkDb = async () => {
      if (!isSupabaseConfigured) {
        setDbStatus('local');
        setDbError(null);
        return;
      }
      try {
        const { error } = await supabase.from('patients').select('id').limit(1);
        if (error) throw error;
        setDbStatus('connected');
        setDbError(null);
      } catch (e: any) {
        setDbStatus('local');
        setDbError(e?.message || 'Gagal menghubungi server database Supabase.');
      }
    };
    checkDb();
  }, []);

  const handleShowDbInfo = () => {
    if (dbStatus === 'connected') {
      Swal.fire({
        title: 'Status Database',
        icon: 'success',
        html: `
          <div class="text-left space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>Status:</strong> Terhubung dengan Supabase Cloud ✅</p>
            <p><strong>Penyimpanan:</strong> Data Anda disinkronkan secara real-time ke tabel <code>patients</code> di cloud.</p>
            <p><strong>Offline-First:</strong> Jika internet Anda terputus, data tetap tersimpan di browser Anda (Local Storage) dan akan otomatis sinkron saat terhubung kembali.</p>
          </div>
        `,
        confirmButtonColor: '#4f46e5'
      });
    } else {
      Swal.fire({
        title: 'Konfigurasi Supabase',
        icon: 'warning',
        width: '580px',
        html: `
          <div class="text-left space-y-3.5 text-sm text-gray-700 dark:text-gray-300">
            <p class="font-semibold text-amber-600 dark:text-amber-400">Aplikasi saat ini berjalan menggunakan database Lokal (Local Storage) karena Supabase belum dikonfigurasi / belum terhubung.</p>
            
            <p class="font-bold border-b pb-1">Cara Menghubungkan ke Supabase Anda:</p>
            <ol class="list-decimal pl-5 space-y-1">
              <li>Buka menu <strong>Settings</strong> di pojok kanan atas layar AI Studio.</li>
              <li>Tambahkan variabel lingkungan berikut ke bagian rahasia (Secrets/Env Vars):</li>
            </ol>
            
            <pre class="bg-gray-100 dark:bg-gray-800 p-2.5 rounded text-xs overflow-x-auto font-mono text-gray-800 dark:text-gray-200">
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Alternatif (Vite Fallback):
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key-here
            </pre>
            
            <p class="font-bold border-b pb-1 mt-3">Skema SQL yang Diperlukan:</p>
            <p>Pastikan Anda telah menjalankan kode SQL di <strong>SQL Editor</strong> Supabase Anda dari file <code>supabase_schema.sql</code> di proyek ini untuk membuat tabel <code>patients</code>.</p>
          </div>
        `,
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#4f46e5'
      });
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Data Pasien', path: '/data-pasien', icon: Users },
    { name: 'Rekap Laporan', path: '/laporan', icon: FileText },
    { name: 'Monitoring Pengajuan', path: '/monitoring', icon: Activity },
    { name: 'Pengaturan', path: '/pengaturan', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col">
        <div className="py-4 px-6 border-b border-gray-200 dark:border-gray-700 flex flex-col justify-center">
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 leading-tight">CARE-PBI Sukabumi</h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium leading-tight">
            (Conversion dan Reporting Engine PBI)
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300' 
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6 z-10">
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mr-2 shrink-0"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col justify-center">
              <h1 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 leading-none">CARE-PBI Sukabumi</h1>
              <p className="text-[8px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium leading-none">
                (Conversion dan Reporting Engine PBI)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 ml-auto">
            {/* Database Status Indicator */}
            <button
              onClick={handleShowDbInfo}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                dbStatus === 'checking' 
                  ? 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 animate-pulse'
                  : dbStatus === 'connected'
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30 dark:hover:bg-green-950/40'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 dark:hover:bg-amber-950/40'
              }`}
              title="Klik untuk detail status database"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Database:</span>
              <span className="font-bold">
                {dbStatus === 'checking' ? 'Mengecek...' : dbStatus === 'connected' ? 'Supabase' : 'Lokal (Offline)'}
              </span>
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {profile?.nama || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {profile?.role || 'Role'} • {profile?.unit || 'Unit'}
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold uppercase">
                {profile?.nama?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
          {isSupabaseConfigured && dbStatus !== 'connected' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 p-4 rounded-xl flex items-start gap-3 shadow-sm mb-6 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <h4 className="font-bold text-sm">Supabase Terkonfigurasi tetapi Gagal Terhubung</h4>
                <p className="text-xs mt-1 leading-relaxed">
                  Aplikasi mendeteksi variabel lingkungan Supabase Anda, namun sistem gagal menghubungi server. 
                  Untuk menjaga kenyamanan kerja Anda, data baru saat ini disimpan aman secara lokal (Local Storage) dan akan otomatis disinkronisasi ketika koneksi berhasil diperbaiki.
                </p>
                {dbError && (
                  <p className="text-xs mt-2 font-mono bg-amber-100/50 dark:bg-amber-950/40 p-2 rounded text-amber-900 dark:text-amber-300 overflow-x-auto">
                    <strong>Detail Error:</strong> {dbError}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
                  <Link 
                    to="/pengaturan" 
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Buka Pengaturan & Panduan Setup &rarr;
                  </Link>
                  <button
                    onClick={() => {
                      setDbStatus('checking');
                      const checkDb = async () => {
                        try {
                          const { error } = await supabase.from('patients').select('id').limit(1);
                          if (error) throw error;
                          setDbStatus('connected');
                          setDbError(null);
                        } catch (e: any) {
                          setDbStatus('local');
                          setDbError(e?.message || 'Gagal menghubungi server database Supabase.');
                        }
                      };
                      checkDb();
                    }}
                    className="text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 border-l pl-4 border-amber-200 dark:border-amber-900/50"
                  >
                    Uji Ulang Koneksi
                  </button>
                </div>
              </div>
            </div>
          )}
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Sheet Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />

            {/* Bottom Sheet Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-800 rounded-t-2xl z-50 md:hidden flex flex-col max-h-[85vh] shadow-2xl border-t border-gray-200 dark:border-gray-700 pb-6"
            >
              {/* Pull handle/indicator */}
              <div className="flex justify-center py-3 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100 dark:border-gray-700/50">
                <div>
                  <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Menu Navigasi</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">CARE-PBI Sukabumi</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                  title="Tutup Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Info inside drawer */}
              <div className="p-4 mx-6 my-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl flex items-center space-x-3 border border-gray-100 dark:border-gray-800/50">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold uppercase shrink-0">
                  {profile?.nama?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {profile?.nama || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {profile?.role || 'Role'} • {profile?.unit || 'Unit'}
                  </p>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto px-6 py-2 space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
                        isActive 
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 border-l-4 border-indigo-600 dark:border-indigo-400 pl-3' 
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Quick Actions */}
              <div className="px-6 pt-4 border-t border-gray-100 dark:border-gray-700/50 grid grid-cols-2 gap-3 bg-gray-50/50 dark:bg-gray-900/10">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 border border-red-100 dark:border-red-950/40"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Logout
                </button>
                
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-500" />
                      Mode Terang
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-indigo-500" />
                      Mode Gelap
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
