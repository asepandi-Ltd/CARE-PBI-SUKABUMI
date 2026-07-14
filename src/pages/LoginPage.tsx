import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Activity, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { mockLogin } = useAuthStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg('');
    
    const inputVal = data.email?.trim().toLowerCase() || '';
    const pwdVal = data.password || '';

    try {
      // 1. Check for requested credentials
      if (inputVal === 'asep andi' && pwdVal === 'superadmin') {
        mockLogin('asep andi', 'Super Admin', 'Asep Andi', 'IT / Manajemen');
        navigate('/dashboard');
        return;
      }
      
      if (inputVal === 'siti hindun' && pwdVal === 'rm') {
        mockLogin('siti hindun', 'Penginput Data (RM)', 'Siti Hindun', 'Rekam Medis');
        navigate('/dashboard');
        return;
      }

      if (inputVal === 'kiki' && pwdVal === 'slrt') {
        mockLogin('kiki', 'Verifikator Data (SLRT)', 'Kiki', 'SLRT');
        navigate('/dashboard');
        return;
      }

      // Default mock admin
      if ((inputVal === 'admin' && pwdVal === 'admin') || inputVal === 'admin@rsudalmulk.co.id') {
        mockLogin('admin', 'Super Admin', 'Admin RS', 'IT');
        navigate('/dashboard');
        return;
      }

      // 2. Try Supabase login if input looks like an email and is configured
      if (inputVal.includes('@')) {
        if (!isSupabaseConfigured) {
          throw new Error('Database Supabase belum dikonfigurasi. Silakan masuk menggunakan akun demo (misalnya asep andi, siti hindun, kiki) atau hubungkan Supabase di menu Pengaturan.');
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          throw error;
        }
        
        navigate('/dashboard');
        return;
      }

      throw new Error('Username atau Password salah. Gunakan petunjuk akun di bawah form.');
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal login. Silakan periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Activity className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
          CARE-PBI Sukabumi
        </h2>
        <p className="mt-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          (Conversion dan Reporting Engine PBI)
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Login ke Dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 dark:border-gray-700">
          
          {errorMsg && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username atau Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('email', { required: 'Username atau Email wajib diisi' })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="asep andi / siti hindun / kiki"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button type="button" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                  Lupa password?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Masuk'}
              </button>
            </div>
          </form>

          {/* Akun Demo Cheat-Sheet */}
          <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-5">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Pilih Akun Demo / Petugas:</h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100/50 dark:border-indigo-900/40">
                <div className="flex justify-between font-semibold text-indigo-900 dark:text-indigo-300">
                  <span>Asep Andi (Superadmin)</span>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded">superadmin</span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                  <span>Username: <code className="bg-white dark:bg-gray-800 px-1 rounded text-indigo-600 dark:text-indigo-400">asep andi</code></span>
                  <span>Password: <code className="bg-white dark:bg-gray-800 px-1 rounded text-indigo-600 dark:text-indigo-400">superadmin</code></span>
                </div>
              </div>

              <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100/50 dark:border-blue-900/40">
                <div className="flex justify-between font-semibold text-blue-900 dark:text-blue-300">
                  <span>Siti Hindun (Penginput Data)</span>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">rm</span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                  <span>Username: <code className="bg-white dark:bg-gray-800 px-1 rounded text-blue-600 dark:text-blue-400">siti hindun</code></span>
                  <span>Password: <code className="bg-white dark:bg-gray-800 px-1 rounded text-blue-600 dark:text-blue-400">rm</code></span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100/50 dark:border-emerald-900/40">
                <div className="flex justify-between font-semibold text-emerald-900 dark:text-emerald-300">
                  <span>Kiki (Verifikator Data)</span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded">slrt</span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                  <span>Username: <code className="bg-white dark:bg-gray-800 px-1 rounded text-emerald-600 dark:text-emerald-400">kiki</code></span>
                  <span>Password: <code className="bg-white dark:bg-gray-800 px-1 rounded text-emerald-600 dark:text-emerald-400">slrt</code></span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              &larr; Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
