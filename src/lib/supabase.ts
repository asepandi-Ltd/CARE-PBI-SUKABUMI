import { createClient } from '@supabase/supabase-js';

// Helper function to sanitize user-entered environment variables
const sanitizeUrl = (url: string | undefined): string => {
  if (!url) return '';
  let cleaned = url.trim();
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
  // Remove trailing slashes again after stripping path
  while (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  return cleaned;
};

const sanitizeKey = (key: string | undefined): string => {
  if (!key) return '';
  let cleaned = key.trim();
  // Remove surrounding single or double quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
};

const rawUrl = (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL || (import.meta as any).env.VITE_SUPABASE_URL;
const rawKey = (import.meta as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = sanitizeUrl(rawUrl) || 'https://placeholder.supabase.co';
const supabaseAnonKey = sanitizeKey(rawKey) || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if Supabase keys are configured properly (not placeholders)
export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseUrl !== 'YOUR_NEXT_PUBLIC_SUPABASE_URL' &&
  supabaseAnonKey !== 'placeholder-anon-key' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
  supabaseAnonKey !== 'YOUR_NEXT_PUBLIC_SUPABASE_ANON_KEY' &&
  !supabaseUrl.includes('placeholder')
);

// Secure UUID v4 Generator for client-side persistence compatible with Supabase UUID type
export const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Standard mock initial patients with valid UUIDs
export const INITIAL_MOCK_PATIENTS = [
  {
    id: 'd3b07384-d113-4c54-9e8c-851720d20001',
    no_spr: 'SPR/2026/001',
    tanggal_spr: '2026-07-01',
    nama: 'Budi Santoso',
    nik: '3202011204850001',
    no_kk: '3202011204850002',
    alamat: 'Jl. Ahmad Yani No. 45, Sukabumi',
    tanggal_lahir: '1985-04-12',
    no_hp: '081234567890',
    cara_bayar: 'KTP/KK',
    jenis_pasien: 'IGD',
    status_pengajuan: 'Menunggu Verifikasi',
    penyebab_penolakan: '',
    status_warning: 'aman',
    doc_spr: true,
    doc_ktp: true,
    doc_kk: true,
    tidak_ada_jkn_kis: 0,
    created_at: '2026-07-01T10:00:00Z',
    updated_at: '2026-07-01T10:00:00Z'
  },
  {
    id: 'd3b07384-d113-4c54-9e8c-851720d20002',
    no_spr: 'SPR/2026/002',
    tanggal_spr: '2026-07-02',
    nama: 'Siti Aminah',
    nik: '3202014508900003',
    no_kk: '3202014508900004',
    alamat: 'Kp. Caringin RT 02/RW 05, Baros, Sukabumi',
    tanggal_lahir: '1990-08-15',
    no_hp: '082198765432',
    cara_bayar: 'Tunai',
    jenis_pasien: 'Rawat Inap',
    status_pengajuan: 'Disetujui',
    penyebab_penolakan: '',
    status_warning: 'aman',
    doc_spr: true,
    doc_ktp: true,
    doc_kk: true,
    tidak_ada_jkn_kis: 0,
    created_at: '2026-07-02T11:30:00Z',
    updated_at: '2026-07-03T09:00:00Z'
  },
  {
    id: 'd3b07384-d113-4c54-9e8c-851720d20003',
    no_spr: 'SPR/2026/003',
    tanggal_spr: '2026-07-03',
    nama: 'Asep Sunandar',
    nik: '3202021109780005',
    no_kk: '3202021109780006',
    alamat: 'Cikole RT 01/RW 02, Sukabumi',
    tanggal_lahir: '1978-09-11',
    no_hp: '085712345678',
    cara_bayar: 'BPJS Non Aktif',
    jenis_pasien: 'Rawat Inap',
    status_pengajuan: 'Ditolak',
    penyebab_penolakan: 'Dokumen KK kurang jelas / tidak terbaca',
    status_warning: 'warning',
    doc_spr: true,
    doc_ktp: false,
    doc_kk: true,
    tidak_ada_jkn_kis: 0,
    created_at: '2026-07-03T14:15:00Z',
    updated_at: '2026-07-04T10:30:00Z'
  }
];

export const getLocalPatients = (): any[] => {
  const saved = localStorage.getItem('care_pbi_patients');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Enforce valid UUIDs on older non-UUID local records
        return parsed.map(p => {
          if (!p.id || p.id.length < 15 || !p.id.includes('-')) {
            p.id = generateUUID();
          }
          return p;
        });
      }
    } catch (e) {
      // JSON parse error
    }
  }
  localStorage.setItem('care_pbi_patients', JSON.stringify(INITIAL_MOCK_PATIENTS));
  return INITIAL_MOCK_PATIENTS;
};

const isValidUUID = (id: string | null | undefined): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const sanitizePatientForSupabase = (p: any, currentUserId?: string) => {
  const createdBy = p.created_by || currentUserId || null;
  return {
    id: (p.id && p.id.length >= 15 && p.id.includes('-')) ? p.id : generateUUID(),
    no_spr: p.no_spr || '',
    tanggal_spr: p.tanggal_spr || new Date().toISOString().split('T')[0],
    nama: p.nama || '',
    nik: p.nik || '',
    no_kk: p.no_kk || '',
    alamat: p.alamat || '',
    tanggal_lahir: p.tanggal_lahir || '',
    no_hp: p.no_hp || null,
    cara_bayar: p.cara_bayar || 'KTP/KK',
    jenis_pasien: p.jenis_pasien || 'Rawat Inap',
    status_pengajuan: p.status_pengajuan || 'Draft',
    penyebab_penolakan: p.penyebab_penolakan || null,
    status_warning: p.status_warning || 'aman',
    doc_spr: !!p.doc_spr,
    doc_ktp: !!p.doc_ktp,
    doc_kk: !!p.doc_kk,
    tidak_ada_jkn_kis: p.tidak_ada_jkn_kis !== undefined && p.tidak_ada_jkn_kis !== null ? Number(p.tidak_ada_jkn_kis) : 0,
    created_by: isValidUUID(createdBy) ? createdBy : null,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString()
  };
};

// Robust fetch & sync engine
export const fetchAndSyncPatients = async (): Promise<{ data: any[]; isSynced: boolean; error: string | null }> => {
  const localList = getLocalPatients();

  if (!isSupabaseConfigured) {
    return { data: localList, isSynced: false, error: 'Database Supabase belum dikonfigurasi.' };
  }

  try {
    // Check connection and fetch data
    const { data: remoteList, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    const remotePatients = remoteList || [];
    const remoteIdSet = new Set(remotePatients.map(p => p.id));
    const remoteNikSet = new Set(remotePatients.map(p => p.nik));
    const remoteSprSet = new Set(remotePatients.map(p => p.no_spr));

    // Find local patients that do NOT exist in remote database (by UUID, NIK, or SPR)
    const unsyncedLocal = localList.filter(p => 
      !remoteIdSet.has(p.id) && 
      !remoteNikSet.has(p.nik) && 
      !remoteSprSet.has(p.no_spr)
    );

    if (unsyncedLocal.length > 0) {
      const sanitizedToInsert = unsyncedLocal.map(p => sanitizePatientForSupabase(p));
      
      let { error: insertError } = await supabase
        .from('patients')
        .insert(sanitizedToInsert);

      // Handle missing 'tidak_ada_jkn_kis' column on old Supabase tables on the fly
      if (insertError && (insertError.message?.includes('tidak_ada_jkn_kis') || insertError.code === '42703')) {
        console.warn('Column tidak_ada_jkn_kis not found in Supabase table. Retrying insert without it...');
        const retriedPayload = sanitizedToInsert.map(p => {
          const { tidak_ada_jkn_kis, ...rest } = p as any;
          return rest;
        });
        const { error: retryError } = await supabase
          .from('patients')
          .insert(retriedPayload);
        insertError = retryError;
      }

      if (insertError) {
        console.error('Error auto-syncing local patients to Supabase:', insertError);
        // CRITICAL: DO NOT overwrite local storage to delete unsynced data!
        // We will merge local and remote lists instead!
        const mergedList = [...remotePatients];
        unsyncedLocal.forEach(localP => {
          if (!remoteIdSet.has(localP.id) && !remoteNikSet.has(localP.nik)) {
            mergedList.push(localP);
          }
        });
        localStorage.setItem('care_pbi_patients', JSON.stringify(mergedList));
        return { data: mergedList, isSynced: false, error: insertError.message };
      } else {
        // Fetch again after sync to get updated remote state
        const { data: updatedRemote } = await supabase
          .from('patients')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (updatedRemote) {
          // Keep local values for tidak_ada_jkn_kis if they are missing or 0 in remote (since column might not exist)
          const mergedRemoteWithLocal = updatedRemote.map(remoteP => {
            const localP = localList.find(p => p.id === remoteP.id || p.nik === remoteP.nik);
            if (localP && localP.tidak_ada_jkn_kis) {
              return { ...remoteP, tidak_ada_jkn_kis: localP.tidak_ada_jkn_kis };
            }
            return remoteP;
          });
          localStorage.setItem('care_pbi_patients', JSON.stringify(mergedRemoteWithLocal));
          return { data: mergedRemoteWithLocal, isSynced: true, error: null };
        }
      }
    }

    // Merge and update local storage with remote database state
    // Let's also preserve local tidak_ada_jkn_kis if they exist locally
    const mergedRemoteWithLocal = remotePatients.map(remoteP => {
      const localP = localList.find(p => p.id === remoteP.id || p.nik === remoteP.nik);
      if (localP && localP.tidak_ada_jkn_kis) {
        return { ...remoteP, tidak_ada_jkn_kis: localP.tidak_ada_jkn_kis };
      }
      return remoteP;
    });
    localStorage.setItem('care_pbi_patients', JSON.stringify(mergedRemoteWithLocal));
    return { data: mergedRemoteWithLocal, isSynced: true, error: null };

  } catch (err: any) {
    console.warn('Supabase sync warning:', err.message || err);
    return { 
      data: localList, 
      isSynced: false, 
      error: `Koneksi Supabase bermasalah atau tabel belum dibuat: ${err.message || err}`
    };
  }
};
