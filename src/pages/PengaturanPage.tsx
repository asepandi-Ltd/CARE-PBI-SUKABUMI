import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  Settings, Shield, User, Database, Globe, Layout, 
  Image as ImageIcon, Upload, Copy, Check, Info, 
  FileJson, Key, AlertCircle, RefreshCw, Server, Video
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';

const BACKGROUND_PRESETS = [
  {
    name: 'Modern Hospital Ward (Default)',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=200&auto=format&fit=crop'
  },
  {
    name: 'Medical Technology Concept',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=200&auto=format&fit=crop'
  },
  {
    name: 'Patient Clinic Reception',
    url: 'https://images.unsplash.com/photo-1584515901107-568436142e00?q=80&w=2070&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1584515901107-568436142e00?q=80&w=200&auto=format&fit=crop'
  },
  {
    name: 'Abstract Medicine Blue',
    url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2070&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=200&auto=format&fit=crop'
  }
];

const VIDEO_PRESETS = [
  {
    name: 'Hospital Monitor Screen (Video)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-heart-rate-monitor-screen-in-hospital-40333-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=200&auto=format&fit=crop'
  },
  {
    name: 'Abstract Medicine Lab (Video)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-drip-of-medicine-into-a-glass-vial-40439-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=200&auto=format&fit=crop'
  },
  {
    name: 'DNA Helix Animation (Video)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-dna-and-molecules-40285-large.mp4',
    thumb: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=200&auto=format&fit=crop'
  }
];

export default function PengaturanPage() {
  const { profile } = useAuthStore();

  if (profile?.role !== 'Super Admin') {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 text-center max-w-lg mx-auto mt-12 space-y-4 shadow-sm animate-fadeIn">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Akses Ditolak</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Halaman Pengaturan hanya dapat diakses oleh pengguna dengan peran <strong>Super Admin</strong>.
        </p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'profile' | 'welcome' | 'database' | 'backup'>('profile');
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [connError, setConnError] = useState<string | null>(null);

  // Instansi & User State
  const [instansi, setInstansi] = useState(localStorage.getItem('care_pbi_instansi') || 'RSUD Al-Mulk Kota Sukabumi');
  const [nama, setNama] = useState(profile?.nama || 'Admin RS');
  const [unit, setUnit] = useState(profile?.unit || 'IT');

  // Welcome page state
  const [welcomeTitle, setWelcomeTitle] = useState(localStorage.getItem('care_pbi_welcome_title') || 'Sukabumi');
  const [welcomeDesc, setWelcomeDesc] = useState(localStorage.getItem('care_pbi_welcome_desc') || 'Platform digital terpadu untuk pencatatan, monitoring, pelaporan, dan evaluasi pengajuan pasien menjadi peserta BPJS PBI secara cepat, akurat, aman, dan real-time.');
  const [welcomeBg, setWelcomeBg] = useState(localStorage.getItem('care_pbi_welcome_bg') || BACKGROUND_PRESETS[0].url);

  // Supabase credentials input state
  const [inputUrl, setInputUrl] = useState(localStorage.getItem('supabase_url') || '');
  const [inputKey, setInputKey] = useState(localStorage.getItem('supabase_anon_key') || '');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    setConnError(null);
    try {
      if (!isSupabaseConfigured) {
        setConnectionStatus('disconnected');
        setConnError('Kredensial Supabase (URL / ANON KEY) belum terpasang di variable lingkungan.');
        return;
      }
      
      const { data, error } = await supabase.from('patients').select('id').limit(1);
      if (error) {
        setConnectionStatus('disconnected');
        setConnError(error.message);
      } else {
        setConnectionStatus('connected');
      }
    } catch (err: any) {
      setConnectionStatus('disconnected');
      setConnError(err?.message || 'Gagal menghubungi server database Supabase.');
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      Swal.fire('Peringatan', 'Harap isi kedua kolom URL dan ANON KEY!', 'warning');
      return;
    }

    const cleanUrl = inputUrl.trim().replace(/\/$/, '');
    const cleanKey = inputKey.trim();

    localStorage.setItem('supabase_url', cleanUrl);
    localStorage.setItem('supabase_anon_key', cleanKey);

    Swal.fire({
      title: 'Sedang Menghubungkan...',
      text: 'Mencoba melakukan verifikasi koneksi ke Supabase...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Re-create temporary client to test connection
      const testClient = createClient(cleanUrl, cleanKey);
      const { error } = await testClient.from('patients').select('id').limit(1);

      if (error) {
        throw error;
      }

      Swal.fire({
        title: 'Koneksi Berhasil!',
        text: 'Kredensial valid dan berhasil terhubung ke tabel "patients" di Supabase.',
        icon: 'success',
        confirmButtonColor: '#4f46e5'
      }).then(() => {
        window.location.reload();
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        title: 'Koneksi Gagal',
        text: `Kredensial disimpan tetapi gagal terhubung ke tabel: ${err?.message || 'Pastikan tabel "patients" sudah dibuat menggunakan script SQL di bawah.'}`,
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      }).then(() => {
        window.location.reload();
      });
    }
  };

  const handleClearCredentials = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    Swal.fire({
      title: 'Kredensial Dihapus',
      text: 'Kredensial khusus lokal berhasil dihapus. Aplikasi akan kembali menggunakan variable lingkungan bawaan.',
      icon: 'info',
      confirmButtonColor: '#4f46e5'
    }).then(() => {
      window.location.reload();
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('care_pbi_instansi', instansi);
    Swal.fire({
      title: 'Profil Diperbarui!',
      text: 'Informasi instansi dan profil berhasil disimpan.',
      icon: 'success',
      confirmButtonColor: '#4f46e5'
    }).then(() => {
      window.location.reload();
    });
  };

  const handleSaveWelcome = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('care_pbi_welcome_title', welcomeTitle);
    localStorage.setItem('care_pbi_welcome_desc', welcomeDesc);
    localStorage.setItem('care_pbi_welcome_bg', welcomeBg);
    
    // Also sync the instansi name if edited
    localStorage.setItem('care_pbi_instansi', instansi);

    Swal.fire({
      title: 'Halaman Depan Diperbarui!',
      text: 'Pengaturan Welcome Page berhasil disimpan dan diterapkan.',
      icon: 'success',
      confirmButtonColor: '#4f46e5'
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');

    if (!isImg && !isVid) {
      Swal.fire('Error', 'Berkas yang diunggah harus berupa gambar atau video MP4/WebM!', 'error');
      return;
    }

    const maxSize = isVid ? 15 * 1024 * 1024 : 3 * 1024 * 1024;
    const maxSizeText = isVid ? '15MB' : '3MB';

    if (file.size > maxSize) {
      Swal.fire('Error', `Ukuran ${isVid ? 'video' : 'gambar'} maksimal adalah ${maxSizeText}!`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Url = event.target.result as string;
        setWelcomeBg(base64Url);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `${isVid ? 'Video' : 'Gambar'} berhasil diunggah!`,
          showConfirmButton: false,
          timer: 2000
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBackup = () => {
    const backupData = localStorage.getItem('care_pbi_patients') || '[]';
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CARE_PBI_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    Swal.fire('Berhasil', 'Backup data pasien berhasil diekspor.', 'success');
  };

  const handleRestore = () => {
    Swal.fire({
      title: 'Restore Data',
      text: 'Unggah file backup JSON untuk mengembalikan data pasien.',
      input: 'file',
      inputAttributes: {
        accept: '.json',
        'aria-label': 'Pilih file backup JSON'
      },
      showCancelButton: true,
      confirmButtonText: 'Restore',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#4f46e5'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const file = result.value;
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (Array.isArray(data)) {
              localStorage.setItem('care_pbi_patients', JSON.stringify(data));
              Swal.fire('Berhasil', 'Data berhasil direstore ke penyimpanan lokal!', 'success').then(() => {
                window.location.reload();
              });
            } else {
              Swal.fire('Error', 'Format berkas tidak valid!', 'error');
            }
          } catch (err) {
            Swal.fire('Error', 'Gagal memproses berkas JSON.', 'error');
          }
        };
        reader.readAsText(file);
      }
    });
  };

  const sqlSchemaText = `-- Jalankan SQL ini di Supabase SQL Editor Anda
-- Untuk membuat tabel dan menghidupkan RLS Policies

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Buat Tabel Patients
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_spr TEXT UNIQUE NOT NULL,
    tanggal_spr DATE NOT NULL,
    nama TEXT NOT NULL,
    nik TEXT UNIQUE NOT NULL,
    no_kk TEXT NOT NULL,
    alamat TEXT NOT NULL,
    tanggal_lahir DATE NOT NULL,
    no_hp TEXT,
    cara_bayar TEXT NOT NULL,
    jenis_pasien TEXT NOT NULL,
    status_pengajuan TEXT DEFAULT 'Menunggu Verifikasi',
    penyebab_penolakan TEXT,
    status_warning TEXT DEFAULT 'aman',
    doc_spr BOOLEAN DEFAULT FALSE,
    doc_ktp BOOLEAN DEFAULT FALSE,
    doc_kk BOOLEAN DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Nonaktifkan atau Aktifkan RLS 
-- Untuk memudahkan prototype, ijinkan akses penuh
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.patients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.patients FOR DELETE USING (true);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Skrip SQL disalin ke clipboard!',
      showConfirmButton: false,
      timer: 2000
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-sans">Pengaturan Sistem</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Konfigurasi visual, fungsionalitas, landing page, dan integrasi cloud database</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar menu for tabs */}
        <div className="md:col-span-1 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1 h-fit">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <User className="w-4 h-4" />
            Profil Instansi
          </button>
          
          <button 
            onClick={() => setActiveTab('welcome')}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'welcome'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Layout className="w-4 h-4" />
            Halaman Depan
          </button>

          <button 
            onClick={() => setActiveTab('database')}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'database'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Server className="w-4 h-4" />
            Koneksi Supabase
          </button>

          <button 
            onClick={() => setActiveTab('backup')}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'backup'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Database className="w-4 h-4" />
            Backup &amp; Restore
          </button>
        </div>

        {/* Action Content Panel */}
        <div className="md:col-span-3 space-y-6">
          
          {/* TAB 1: PROFIL & INSTANSI */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profil &amp; Instansi</h2>
              </div>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Nama Rumah Sakit / Instansi</label>
                  <input
                    type="text"
                    value={instansi}
                    onChange={(e) => setInstansi(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: RSUD Al-Mulk Kota Sukabumi"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Nama ini akan muncul pada Kop Surat, Laporan, dan Header Utama.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Nama Petugas Default</label>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Unit Tugas</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-2"
                  >
                    Simpan Profil &amp; Instansi
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: HALAMAN DEPAN (WELCOME PAGE) */}
          {activeTab === 'welcome' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Layout className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kustomisasi Halaman Depan (Welcome Page)</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Ubah gambar latar belakang, judul, nama instansi, dan deskripsi teks pada landing page utama.</p>
              
              <form onSubmit={handleSaveWelcome} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Nama Instansi Singkat (Navbar)</label>
                    <input
                      type="text"
                      value={instansi.replace(' Kota Sukabumi', '').trim()}
                      onChange={(e) => setInstansi(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="RSUD Al-Mulk"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Sub Judul Utama (Highlight)</label>
                    <input
                      type="text"
                      value={welcomeTitle}
                      onChange={(e) => setWelcomeTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Sukabumi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Deskripsi Utama</label>
                  <textarea
                    rows={3}
                    value={welcomeDesc}
                    onChange={(e) => setWelcomeDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Tulis deskripsi program fungsional di halaman depan..."
                  />
                </div>

                 {/* BACKGROUND MEDIA SETTING */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Latar Belakang Gambar / Video (Landing Page)
                  </h3>

                  {/* IMAGE PRESETS */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Preset Gambar Profesional:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {BACKGROUND_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setWelcomeBg(p.url)}
                          className={`relative rounded-lg overflow-hidden border-2 text-left h-20 transition-all ${
                            welcomeBg === p.url 
                              ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
                              : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img src={p.thumb} alt={p.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                            <span className="text-[9px] font-bold text-white leading-tight truncate w-full">{p.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* VIDEO PRESETS */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Preset Video Gerak Profesional (MP4):</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {VIDEO_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setWelcomeBg(p.url)}
                          className={`relative rounded-lg overflow-hidden border-2 text-left h-20 transition-all ${
                            welcomeBg === p.url 
                              ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
                              : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img src={p.thumb} alt={p.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 flex flex-col justify-between p-1.5">
                            <span className="bg-indigo-600 text-[8px] text-white px-1.5 py-0.5 rounded-full font-bold w-fit uppercase">Video</span>
                            <span className="text-[9px] font-bold text-white leading-tight truncate w-full">{p.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CUSTOM UPLOAD / URL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Unggah Media Sendiri (Gambar atau Video)</label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors relative">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block cursor-pointer">Pilih berkas gambar atau video</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Gambar (Maks 3MB) | Video MP4/WebM (Maks 15MB)</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Atau Masukkan URL Media Kustom</label>
                      <input
                        type="url"
                        value={welcomeBg.startsWith('data:') ? '' : welcomeBg}
                        onChange={(e) => {
                          if (e.target.value) setWelcomeBg(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                        placeholder="https://images.unsplash.com/... ATAU https://...video.mp4"
                      />
                      {welcomeBg.startsWith('data:') ? (
                        <p className="text-[11px] text-green-600 dark:text-green-400 mt-1.5 font-medium">✓ Saat ini menggunakan Media yang baru Anda Unggah.</p>
                      ) : (
                        <div className="mt-2 border rounded-lg overflow-hidden h-14 bg-gray-50 dark:bg-gray-900/40 p-1 flex items-center gap-2">
                          {welcomeBg.toLowerCase().endsWith('.mp4') || welcomeBg.toLowerCase().includes('.mp4') || welcomeBg.startsWith('data:video/') || welcomeBg.includes('mixkit.co/videos/') ? (
                            <video src={welcomeBg} muted className="w-16 h-12 object-cover rounded" />
                          ) : (
                            <img src={welcomeBg} alt="Preview" className="w-16 h-12 object-cover rounded" />
                          )}
                          <span className="text-[10px] text-gray-400 truncate flex-1">{welcomeBg}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-2"
                  >
                    Simpan &amp; Terapkan ke Landing Page
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: KONEKSI SUPABASE & SQL */}
          {activeTab === 'database' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Status &amp; Kredensial Supabase</h2>
                </div>
                
                <button 
                  onClick={checkConnection}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                  title="Refresh status koneksi"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-once" />
                </button>
              </div>

              {/* CONNECTION STATUS CARD */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                connectionStatus === 'connected'
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400'
                  : connectionStatus === 'checking'
                  ? 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 animate-pulse'
                  : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400'
              }`}>
                <Info className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm">
                    {connectionStatus === 'connected' 
                      ? 'Koneksi Berhasil!' 
                      : connectionStatus === 'checking' 
                      ? 'Mengecek Koneksi...' 
                      : 'Menggunakan Penyimpanan Lokal (Offline)'}
                  </h3>
                  <p className="text-xs mt-1 leading-relaxed">
                    {connectionStatus === 'connected'
                      ? 'Aplikasi telah berhasil terhubung dengan cloud database Supabase. Semua input, edit, verifikasi dokumen, dan pencarian pasien disinkronisasi secara real-time.'
                      : connectionStatus === 'checking'
                      ? 'Sedang melakukan uji ping ke endpoint URL database...'
                      : `Aplikasi berjalan lancar menggunakan Local Storage browser Anda karena database belum terhubung. Error: ${connError || 'Belum dikonfigurasi'}`}
                  </p>
                </div>
              </div>

              {/* FORM UNTUK INPUT KREDENSIAL SUPABASE SECARA DINAMIS */}
              <form onSubmit={handleSaveCredentials} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Atur Kredensial Database Supabase (Local Browser)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Jika Anda tidak menggunakan variable lingkungan container (.env), Anda dapat langsung menempelkan kredensial proyek Supabase Anda di bawah ini. Kredensial akan disimpan dengan aman di penyimpanan lokal peramban Anda.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">SUPABASE URL</label>
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://your-project.supabase.co"
                      className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">SUPABASE ANON KEY</label>
                    <input
                      type="text"
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="eyJh..."
                      className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  { (localStorage.getItem('supabase_url') || localStorage.getItem('supabase_anon_key')) && (
                    <button
                      type="button"
                      onClick={handleClearCredentials}
                      className="px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg transition-all"
                    >
                      Hapus Kredensial
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    Simpan &amp; Hubungkan
                  </button>
                </div>
              </form>

              {/* STEPS TO CONNECT SUPABASE */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Bagaimana cara menghubungkan aplikasi dengan Supabase Anda?
                </h3>
                
                <div className="relative border-l border-indigo-200 dark:border-indigo-900/80 pl-5 ml-2.5 space-y-6 text-sm">
                  {/* Step 1 */}
                  <div className="relative">
                    <span className="absolute -left-8 top-0.5 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Dapatkan API Credentials di Supabase</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Masuk ke dashboard proyek Supabase Anda. Buka menu <strong>Project Settings</strong> &gt; <strong>API</strong>. 
                      Salin <strong>Project URL</strong> dan <strong>anon public API Key</strong>.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <span className="absolute -left-8 top-0.5 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Masukkan Variabel Lingkungan di AI Studio</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Klik ikon <strong>Settings / Gear</strong> di panel kiri AI Studio Anda. Masukkan kedua nilai di atas dengan nama:
                    </p>
                    <ul className="list-disc list-inside mt-1.5 text-xs font-mono space-y-1 text-gray-700 dark:text-gray-300">
                      <li>NEXT_PUBLIC_SUPABASE_URL = <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">https://your-proj.supabase.co</span></li>
                      <li>NEXT_PUBLIC_SUPABASE_ANON_KEY = <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">eyJh...</span></li>
                    </ul>
                    <div className="mt-2 text-[11px] bg-indigo-50 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300 p-2.5 rounded-md space-y-1">
                      <div><strong>Info Penting:</strong> Pastikan Anda tidak menyertakan tanda kutip (<code>"</code> atau <code>'</code>) atau garis miring akhir (<code>/</code>) di ujung URL Anda.</div>
                      <div className="text-gray-500 dark:text-gray-400 text-[10px]">Catatan: Format <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> juga didukung sebagai cadangan (fallback).</div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <span className="absolute -left-8 top-0.5 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Jalankan Struktur SQL di Editor Supabase</h4>
                      <button
                        onClick={copySqlToClipboard}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Tersalin' : 'Salin SQL Schema'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Supabase membutuhkan tabel <code>patients</code> untuk menampung data. Buka <strong>SQL Editor</strong> di dashboard Supabase Anda, klik <strong>New Query</strong>, tempelkan skrip di bawah ini, dan klik <strong>RUN</strong>.
                    </p>

                    <div className="mt-2.5 bg-gray-900 text-gray-300 p-3 rounded-lg font-mono text-[11px] max-h-48 overflow-y-auto border border-gray-800 shadow-inner relative">
                      <pre className="whitespace-pre">{sqlSchemaText}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Penyimpanan lokal &amp; Ekspor Data</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Gunakan menu ini untuk mengamankan data pasien yang tersimpan secara lokal ke komputer Anda dalam format terstruktur (JSON). 
                Anda dapat mengembalikan (restore) data ini kapan saja meskipun berganti peramban atau setelah membersihkan cache.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleBackup}
                  className="px-5 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <FileJson className="w-4 h-4" />
                  Unduh Cadangan Database (JSON)
                </button>
                
                <button
                  onClick={handleRestore}
                  className="px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Restore Cadangan (.json)
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 p-4 rounded-lg mt-4 flex gap-3 items-start text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <strong className="text-gray-700 dark:text-gray-300">Peringatan Penghancuran Cache:</strong> Jika Anda melakukan restore data, seluruh data pasien lokal saat ini akan ditimpa dengan data dari file cadangan yang diunggah. Pastikan file cadangan yang Anda pilih valid dan berasal dari ekspor aplikasi ini.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
