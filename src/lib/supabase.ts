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

const getLocalCredential = (key: string): string => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key) || '';
    }
  } catch (e) {}
  return '';
};

const rawUrl = getLocalCredential('supabase_url') || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL || (import.meta as any).env.VITE_SUPABASE_URL;
const rawKey = getLocalCredential('supabase_anon_key') || (import.meta as any).env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

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

// Target names to delete from all databases (one-time cleanup)
const TARGETS_TO_DELETE = ['as', 'asep sunandar', 'siti aminah', 'budi santoso'];

// Standard mock initial patients with valid UUIDs (empty since the requested ones are deleted)
export const INITIAL_MOCK_PATIENTS: any[] = [];

export const getLocalPatients = (): any[] => {
  const saved = localStorage.getItem('care_pbi_patients');
  let patients: any[] = [];
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        patients = parsed;
      }
    } catch (e) {
      // JSON parse error
    }
  } else {
    patients = INITIAL_MOCK_PATIENTS;
  }

  // Check if one-time cleanup has been completed
  const hasCleaned = localStorage.getItem('care_pbi_cleaned_initial_targets_v3') === 'true';
  let filtered = patients;

  if (!hasCleaned) {
    // Filter out the specified names (case-insensitive and trimmed)
    filtered = patients.filter(p => {
      const nameLower = (p.nama || '').toLowerCase().trim();
      return !TARGETS_TO_DELETE.includes(nameLower);
    });

    // Save back to local storage
    localStorage.setItem('care_pbi_patients', JSON.stringify(filtered));
    
    // Set flag indicating local cleanup is complete
    localStorage.setItem('care_pbi_cleaned_initial_targets_v3', 'true');
  }

  // Enforce valid UUIDs on older non-UUID local records
  return filtered.map(p => {
    if (!p.id || p.id.length < 15 || !p.id.includes('-')) {
      p.id = generateUUID();
    }
    return p;
  });
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

    const remotePatientsAll = remoteList || [];
    
    // One-time auto-clean target deleted patients from Supabase if found
    const hasCleanedRemote = localStorage.getItem('care_pbi_cleaned_remote_v3') === 'true';
    let remotePatients = remotePatientsAll;

    if (!hasCleanedRemote) {
      const matchingToDelete = remotePatientsAll.filter(p => {
        const nameLower = (p.nama || '').toLowerCase().trim();
        return TARGETS_TO_DELETE.includes(nameLower);
      });

      if (matchingToDelete.length > 0) {
        const idsToDelete = matchingToDelete.map(p => p.id);
        console.warn('Membersihkan data target dari Supabase:', idsToDelete);
        try {
          await supabase.from('patients').delete().in('id', idsToDelete);
        } catch (delErr) {
          console.error('Error deleting target entries:', delErr);
        }
      }

      remotePatients = remotePatientsAll.filter(p => {
        const nameLower = (p.nama || '').toLowerCase().trim();
        return !TARGETS_TO_DELETE.includes(nameLower);
      });

      localStorage.setItem('care_pbi_cleaned_remote_v3', 'true');
    }
    
    const remoteIdSet = new Set(remotePatients.map(p => p.id));
    const remoteNikSet = new Set(remotePatients.map(p => p.nik));
    const remoteSprSet = new Set(remotePatients.map(p => p.no_spr));

    // Find local patients that do NOT exist in remote database (by UUID, NIK, or SPR)
    const unsyncedLocal = localList.filter(p => 
      !remoteIdSet.has(p.id) && 
      !remoteNikSet.has(p.nik) && 
      !remoteSprSet.has(p.no_spr)
    );

    // Ensure we don't have duplicate NIK or SPR *within* unsyncedLocal itself
    const uniqueUnsyncedLocal: any[] = [];
    const seenNik = new Set<string>();
    const seenSpr = new Set<string>();
    for (const p of unsyncedLocal) {
      const pNik = p.nik?.trim();
      const pSpr = p.no_spr?.trim();
      if (pNik && pSpr && !seenNik.has(pNik) && !seenSpr.has(pSpr)) {
        seenNik.add(pNik);
        seenSpr.add(pSpr);
        uniqueUnsyncedLocal.push(p);
      } else {
        console.warn(`Mengabaikan data lokal duplikat saat sinkronisasi: ${p.nama} (NIK: ${pNik})`);
      }
    }

    if (uniqueUnsyncedLocal.length > 0) {
      const sanitizedToInsert = uniqueUnsyncedLocal.map(p => sanitizePatientForSupabase(p));
      
      let { error: insertError } = await supabase
        .from('patients')
        .insert(sanitizedToInsert);

      // Handle missing 'created_by' column on old Supabase tables on the fly
      if (insertError && (insertError.message?.includes('created_by') || insertError.code === '42703')) {
        console.warn('Column created_by not found in Supabase table. Retrying insert without it...');
        const retriedPayload = sanitizedToInsert.map(p => {
          const { created_by, ...rest } = p as any;
          return rest;
        });
        const { error: retryError } = await supabase
          .from('patients')
          .insert(retriedPayload);
        insertError = retryError;
      }

      // If bulk insert fails, run robust one-by-one retry to isolate specific duplicates/errors
      if (insertError) {
        console.warn('Bulk insert failed, retrying one-by-one to isolate conflicts:', insertError.message);
        let syncFailedCount = 0;
        let duplicateNikCount = 0;
        let duplicateSprCount = 0;
        let actualSyncError: string | null = null;

        for (const item of sanitizedToInsert) {
          let { error: singleError } = await supabase
            .from('patients')
            .insert([item]);
          
          if (singleError && (singleError.message?.includes('created_by') || singleError.code === '42703')) {
            const { created_by, ...rest } = item as any;
            const { error: retrySingleError } = await supabase
              .from('patients')
              .insert([rest]);
            singleError = retrySingleError;
          }

          if (singleError) {
            console.error(`Gagal sinkronisasi pasien ${item.nama} (NIK: ${item.nik}):`, singleError);
            const errMsg = singleError.message || '';
            const isDuplicate = singleError.code === '23505' || 
                                errMsg.includes('patients_nik_key') || 
                                errMsg.includes('duplicate key') || 
                                errMsg.includes('violates unique constraint');
            
            if (isDuplicate) {
              if (errMsg.includes('nik') || errMsg.includes('patients_nik_key')) {
                duplicateNikCount++;
              } else if (errMsg.includes('no_spr') || errMsg.includes('patients_no_spr_key')) {
                duplicateSprCount++;
              } else {
                duplicateNikCount++;
              }
            } else {
              syncFailedCount++;
              actualSyncError = singleError.message;
            }
          }
        }

        if (duplicateNikCount > 0 || duplicateSprCount > 0) {
          console.warn(`Selesai sinkronisasi mandiri. Ditemukan ${duplicateNikCount} NIK duplikat dan ${duplicateSprCount} SPR duplikat di server.`);
        }
        
        // Fetch again after one-by-one attempts to get successful insertions
        const { data: updatedRemote } = await supabase
          .from('patients')
          .select('*')
          .order('created_at', { ascending: false });
        
        const mergedRemote = updatedRemote || remotePatients;
        const finalMergedIdSet = new Set(mergedRemote.map(p => p.id));
        const finalMergedNikSet = new Set(mergedRemote.map(p => p.nik));
        
        const mergedList = [...mergedRemote];
        uniqueUnsyncedLocal.forEach(localP => {
          if (!finalMergedIdSet.has(localP.id) && !finalMergedNikSet.has(localP.nik)) {
            mergedList.push(localP);
          }
        });
        
        localStorage.setItem('care_pbi_patients', JSON.stringify(mergedList));
        return { 
          data: mergedList, 
          isSynced: duplicateNikCount === 0 && duplicateSprCount === 0 && syncFailedCount === 0, 
          error: actualSyncError || (duplicateNikCount > 0 || duplicateSprCount > 0 ? 'Beberapa data gagal disinkronkan karena kesamaan NIK/No. SPR unik di server.' : null)
        };
      } else {
        // Fetch again after sync to get updated remote state
        const { data: updatedRemote } = await supabase
          .from('patients')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (updatedRemote) {
          localStorage.setItem('care_pbi_patients', JSON.stringify(updatedRemote));
          return { data: updatedRemote, isSynced: true, error: null };
        }
      }
    }

    // Merge and update local storage with remote database state
    localStorage.setItem('care_pbi_patients', JSON.stringify(remotePatients));
    return { data: remotePatients, isSynced: true, error: null };

  } catch (err: any) {
    console.warn('Supabase sync warning:', err.message || err);
    return { 
      data: localList, 
      isSynced: false, 
      error: `Koneksi Supabase bermasalah atau tabel belum dibuat: ${err.message || err}`
    };
  }
};
