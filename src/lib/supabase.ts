import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper function to sanitize user-entered environment variables or URLs
export const sanitizeUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  let cleaned = String(url).trim();
  // Remove surrounding single or double quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  // Remove trailing slashes
  while (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  // Strip out /rest/v1 or /rest if the user copied the full API endpoint
  if (cleaned.endsWith('/rest/v1')) {
    cleaned = cleaned.slice(0, -8).trim();
  } else if (cleaned.endsWith('/rest')) {
    cleaned = cleaned.slice(0, -5).trim();
  }
  // Strip out /auth/v1 in case they copied the auth endpoint
  if (cleaned.endsWith('/auth/v1')) {
    cleaned = cleaned.slice(0, -8).trim();
  }
  while (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  return cleaned;
};

export const sanitizeKey = (key: string | undefined | null): string => {
  if (!key) return '';
  let cleaned = String(key).trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
};

// Retrieve active Supabase credentials from localStorage or environment variables
export const getSupabaseConfig = () => {
  let storedUrl = '';
  let storedKey = '';
  if (typeof window !== 'undefined') {
    try {
      storedUrl = localStorage.getItem('care_pbi_supabase_url') || '';
      storedKey = localStorage.getItem('care_pbi_supabase_key') || '';
    } catch (e) {
      // localStorage inaccessible
    }
  }

  const rawUrl = storedUrl || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const rawKey = storedKey || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const url = sanitizeUrl(rawUrl);
  const key = sanitizeKey(rawKey);

  const isConfigured = !!(
    url &&
    key &&
    url !== 'https://placeholder.supabase.co' &&
    url !== 'YOUR_SUPABASE_URL' &&
    url !== 'YOUR_NEXT_PUBLIC_SUPABASE_URL' &&
    key !== 'placeholder-anon-key' &&
    key !== 'YOUR_SUPABASE_ANON_KEY' &&
    key !== 'YOUR_NEXT_PUBLIC_SUPABASE_ANON_KEY' &&
    !url.includes('placeholder')
  );

  return {
    url: isConfigured ? url : 'https://placeholder.supabase.co',
    key: isConfigured ? key : 'placeholder-anon-key',
    isConfigured,
    rawUrl: isConfigured ? url : '',
    rawKey: isConfigured ? key : ''
  };
};

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export const getSupabaseClient = (): SupabaseClient => {
  const cfg = getSupabaseConfig();
  if (!cachedClient || lastUsedUrl !== cfg.url || lastUsedKey !== cfg.key) {
    cachedClient = createClient(cfg.url, cfg.key);
    lastUsedUrl = cfg.url;
    lastUsedKey = cfg.key;
  }
  return cachedClient;
};

// Proxied supabase client so existing imports continue working seamlessly
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

// Dynamic configuration check
export const checkSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

export const isSupabaseConfigured = checkSupabaseConfigured();

// Secure UUID v4 Generator compatible with Supabase UUID type
export const generateUUID = (): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Robust normalizers ensuring desil is always 1 s.d 10 and ruangan uses IGD
export const normalizeDesil = (val: any): string => {
  if (val === undefined || val === null || val === '') return '1';
  const str = String(val).trim();
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 1 && num <= 10 && (str === String(num) || str === `Desil ${num}`)) {
    return String(num);
  }
  const matches = str.match(/\d+/g);
  if (matches && matches.length > 0) {
    const lastDigits = matches[matches.length - 1];
    const parsed = parseInt(lastDigits, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return String(((parsed - 1) % 10) + 1);
    }
  }
  return '1';
};

export const normalizeRuangan = (val: any): string => {
  if (!val) return 'IGD';
  const str = String(val).trim();
  if (str === 'IG' || str === 'IGD') return 'IGD';
  if (['Aisyah', 'Fatimah', 'Khadijah', 'Usman'].includes(str)) return str;
  return 'IGD';
};

export const normalizeStatusKK = (val: any): string => {
  if (val === undefined || val === null || val === '') return 'Sudah Masuk KK';
  const str = String(val).trim().toLowerCase();
  if (str.includes('belum') || str === 'tidak') return 'Belum Masuk KK';
  return 'Sudah Masuk KK';
};

// Initial mock patients with valid UUIDs and standard values
export const INITIAL_MOCK_PATIENTS = [
  {
    id: 'd3b07384-d113-4c54-9e8c-851720d20001',
    desil: '1',
    no_spr: '1',
    tanggal_spr: '2026-07-01',
    nama: 'Budi Santoso',
    nik: '3202011204850001',
    no_kk: '3202011204850002',
    status_dalam_kk: 'Sudah Masuk KK',
    alamat: 'Jl. Ahmad Yani No. 45, Sukabumi',
    tanggal_lahir: '1985-04-12',
    no_hp: '081234567890',
    cara_bayar: 'KTP/KK',
    nama_ruangan: 'IGD',
    jenis_pasien: 'IGD',
    status_pengajuan: 'Menunggu Verifikasi',
    penyebab_penolakan: '',
    status_warning: 'aman',
    doc_spr: true,
    doc_ktp: true,
    doc_kk: true,
    created_at: '2026-07-01T10:00:00Z',
    updated_at: '2026-07-01T10:00:00Z'
  },
  {
    id: 'd3b07384-d113-4c54-9e8c-851720d20002',
    desil: '2',
    no_spr: '2',
    tanggal_spr: '2026-07-02',
    nama: 'Siti Aminah',
    nik: '3202014508900003',
    no_kk: '3202014508900004',
    status_dalam_kk: 'Sudah Masuk KK',
    alamat: 'Kp. Caringin RT 02/RW 05, Baros, Sukabumi',
    tanggal_lahir: '1990-08-15',
    no_hp: '082198765432',
    cara_bayar: 'Tunai',
    nama_ruangan: 'Aisyah',
    jenis_pasien: 'Aisyah',
    status_pengajuan: 'Disetujui',
    penyebab_penolakan: '',
    status_warning: 'aman',
    doc_spr: true,
    doc_ktp: true,
    doc_kk: true,
    created_at: '2026-07-02T11:30:00Z',
    updated_at: '2026-07-03T09:00:00Z'
  },
  {
    id: 'd3b07384-d113-4c54-9e8c-851720d20003',
    desil: '3',
    no_spr: '3',
    tanggal_spr: '2026-07-03',
    nama: 'Asep Sunandar',
    nik: '3202021109780005',
    no_kk: '3202021109780006',
    status_dalam_kk: 'Belum Masuk KK',
    alamat: 'Cikole RT 01/RW 02, Sukabumi',
    tanggal_lahir: '1978-09-11',
    no_hp: '085712345678',
    cara_bayar: 'BPJS Non Aktif',
    nama_ruangan: 'Fatimah',
    jenis_pasien: 'Fatimah',
    status_pengajuan: 'Ditolak',
    penyebab_penolakan: 'Dokumen KK kurang jelas / tidak terbaca',
    status_warning: 'warning',
    doc_spr: true,
    doc_ktp: false,
    doc_kk: true,
    created_at: '2026-07-03T14:15:00Z',
    updated_at: '2026-07-04T10:30:00Z'
  }
];

// Safe localStorage persistence with error handling
export const getLocalPatients = (): any[] => {
  if (typeof window === 'undefined') return INITIAL_MOCK_PATIENTS;
  try {
    const saved = localStorage.getItem('care_pbi_patients');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(p => {
          if (!p.id || p.id.length < 15 || !p.id.includes('-')) {
            p.id = generateUUID();
          }
          p.desil = normalizeDesil(p.desil || p.no_spr);
          p.no_spr = p.desil;
          p.nama_ruangan = normalizeRuangan(p.nama_ruangan || p.jenis_pasien);
          p.jenis_pasien = p.nama_ruangan;
          p.status_dalam_kk = normalizeStatusKK(p.status_dalam_kk);
          return p;
        });
      }
    }
  } catch (e) {
    console.warn('Error reading local patients:', e);
  }
  // Initialize with initial mock data if empty
  setLocalPatients(INITIAL_MOCK_PATIENTS);
  return INITIAL_MOCK_PATIENTS;
};

export const setLocalPatients = (list: any[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('care_pbi_patients', JSON.stringify(list));
  } catch (e) {
    console.error('LocalStorage write failed (quota might be exceeded):', e);
  }
};

// Safe formatter ensuring database constraints (valid dates, non-null fields)
export const sanitizePatientForSupabase = (p: any) => {
  const desilVal = normalizeDesil(p.desil || p.no_spr);
  const ruanganVal = normalizeRuangan(p.nama_ruangan || p.jenis_pasien);
  const statusKKVal = normalizeStatusKK(p.status_dalam_kk);

  // Ensure valid date format YYYY-MM-DD so PostgreSQL DATE type never throws error
  const todayStr = new Date().toISOString().split('T')[0];
  const validTanggalSpr = (p.tanggal_spr && /^\d{4}-\d{2}-\d{2}$/.test(p.tanggal_spr))
    ? p.tanggal_spr
    : todayStr;

  const validTanggalLahir = (p.tanggal_lahir && /^\d{4}-\d{2}-\d{2}$/.test(p.tanggal_lahir))
    ? p.tanggal_lahir
    : '2000-01-01';

  return {
    id: (p.id && p.id.length >= 15 && p.id.includes('-')) ? p.id : generateUUID(),
    desil: desilVal,
    no_spr: desilVal,
    tanggal_spr: validTanggalSpr,
    nama: (p.nama || '').trim(),
    nik: (p.nik && String(p.nik).trim() !== '') ? String(p.nik).trim() : null,
    no_kk: (p.no_kk || '').trim(),
    status_dalam_kk: statusKKVal,
    alamat: (p.alamat || '').trim(),
    tanggal_lahir: validTanggalLahir,
    no_hp: (p.no_hp || '').trim() || null,
    cara_bayar: p.cara_bayar || 'KTP/KK',
    nama_ruangan: ruanganVal,
    jenis_pasien: ruanganVal,
    status_pengajuan: p.status_pengajuan || 'Draft',
    penyebab_penolakan: p.penyebab_penolakan || null,
    status_warning: p.status_warning || 'aman',
    doc_spr: !!p.doc_spr,
    doc_ktp: !!p.doc_ktp,
    doc_kk: !!p.doc_kk,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString()
  };
};

// Upsert patient to remote Supabase database with column fallbacks
export const savePatientToRemote = async (patient: any): Promise<{ success: boolean; error?: string }> => {
  const cfg = getSupabaseConfig();
  if (!cfg.isConfigured) {
    return { success: true }; // Running in local mode is expected
  }

  const client = getSupabaseClient();
  const sanitized = sanitizePatientForSupabase(patient);

  try {
    // 1. Try full upsert
    const { error: fullError } = await client
      .from('patients')
      .upsert(sanitized, { onConflict: 'id' });

    if (!fullError) {
      return { success: true };
    }

    console.warn('Initial Supabase upsert failed, testing schema compatibility:', fullError.message);

    // 2. If column status_dalam_kk, desil, or nama_ruangan does not exist yet on Supabase:
    if (fullError.message && (
      fullError.message.includes('column') || 
      fullError.message.includes('schema') ||
      fullError.message.includes('does not exist')
    )) {
      // Fallback A: without status_dalam_kk
      const { status_dalam_kk, ...fallbackA } = sanitized;
      const { error: errA } = await client.from('patients').upsert(fallbackA, { onConflict: 'id' });
      if (!errA) return { success: true };

      // Fallback B: legacy minimal columns
      const legacyMinimal = {
        id: sanitized.id,
        no_spr: sanitized.desil,
        tanggal_spr: sanitized.tanggal_spr,
        nama: sanitized.nama,
        nik: sanitized.nik,
        no_kk: sanitized.no_kk,
        alamat: sanitized.alamat,
        tanggal_lahir: sanitized.tanggal_lahir,
        no_hp: sanitized.no_hp,
        cara_bayar: sanitized.cara_bayar,
        jenis_pasien: sanitized.nama_ruangan,
        status_pengajuan: sanitized.status_pengajuan,
        penyebab_penolakan: sanitized.penyebab_penolakan,
        status_warning: sanitized.status_warning,
        doc_spr: sanitized.doc_spr,
        doc_ktp: sanitized.doc_ktp,
        doc_kk: sanitized.doc_kk,
        created_at: sanitized.created_at,
        updated_at: sanitized.updated_at
      };
      const { error: errB } = await client.from('patients').upsert(legacyMinimal, { onConflict: 'id' });
      if (!errB) return { success: true };

      return { success: false, error: errB.message };
    }

    return { success: false, error: fullError.message };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menghubungi database remote' };
  }
};

// Delete patient from remote Supabase database
export const deletePatientFromRemote = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const cfg = getSupabaseConfig();
  if (!cfg.isConfigured) return { success: true };

  const client = getSupabaseClient();
  try {
    const { error } = await client.from('patients').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menghapus data di Supabase' };
  }
};

// Robust fetch & sync engine that NEVER drops unsynced local data
export const fetchAndSyncPatients = async (): Promise<{ data: any[]; isSynced: boolean; error: string | null }> => {
  const localList = getLocalPatients();
  const cfg = getSupabaseConfig();

  if (!cfg.isConfigured) {
    return { 
      data: localList, 
      isSynced: false, 
      error: 'Database Supabase belum dikonfigurasi (data tersimpan di lokal).' 
    };
  }

  const client = getSupabaseClient();

  try {
    const { data: remoteList, error: fetchError } = await client
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.warn('Supabase fetch failed:', fetchError.message);
      return { data: localList, isSynced: false, error: fetchError.message };
    }

    const remotePatients = (remoteList || []).map(p => ({
      ...p,
      desil: normalizeDesil(p.desil || p.no_spr),
      no_spr: normalizeDesil(p.desil || p.no_spr),
      nama_ruangan: normalizeRuangan(p.nama_ruangan || p.jenis_pasien),
      jenis_pasien: normalizeRuangan(p.nama_ruangan || p.jenis_pasien),
      status_dalam_kk: normalizeStatusKK(p.status_dalam_kk)
    }));

    const remoteIdSet = new Set(remotePatients.map(p => p.id));
    const remoteNikSet = new Set(remotePatients.filter(p => !!p.nik).map(p => p.nik));

    // Find local patients that do NOT exist in remote database yet
    const unsyncedLocal = localList.filter(p => !remoteIdSet.has(p.id) && (!p.nik || !remoteNikSet.has(p.nik)));

    // Merged list: Remote patients + all unsynced local patients (LOCAL DATA IS NEVER WIPED OUT)
    const mergedPatients = [...remotePatients];
    for (const p of unsyncedLocal) {
      mergedPatients.push(p);
      // Attempt background push to remote
      savePatientToRemote(p).catch(() => {});
    }

    // Persist safe merged list to local storage
    setLocalPatients(mergedPatients);

    return { 
      data: mergedPatients, 
      isSynced: unsyncedLocal.length === 0, 
      error: null 
    };

  } catch (err: any) {
    console.warn('Supabase sync warning:', err);
    return { 
      data: localList, 
      isSynced: false, 
      error: `Koneksi Supabase bermasalah: ${err.message || err}` 
    };
  }
};
