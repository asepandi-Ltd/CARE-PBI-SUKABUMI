import { useState, useEffect } from 'react';
import { supabase, getLocalPatients, fetchAndSyncPatients, sanitizePatientForSupabase } from '../lib/supabase';
import { 
  Activity, Check, X, AlertTriangle, Clock, Search, 
  FileText, ChevronRight, User, CheckCircle, 
  Info, ShieldAlert, AlertCircle 
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function MonitoringPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const saveLocalPatients = (updatedList: any[]) => {
    setPatients(updatedList);
    localStorage.setItem('care_pbi_patients', JSON.stringify(updatedList));
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data } = await fetchAndSyncPatients();
      setPatients(data);
    } catch (e) {
      setPatients(getLocalPatients());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Determine if patient has manual warning set, or fallback to auto warning if not initialized
  const getWarningStatus = (patient: any) => {
    if (patient.status_warning !== undefined && patient.status_warning !== null) {
      return patient.status_warning; // 'warning' or 'aman'
    }
    // Fallback to auto logic: 2 days after SPR date
    if (!patient.tanggal_spr) return 'aman';
    const sprDate = new Date(patient.tanggal_spr);
    const today = new Date();
    sprDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - sprDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 2 ? 'warning' : 'aman';
  };

  const handleToggleWarning = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const currentWarning = getWarningStatus(patient);
    const newWarning = currentWarning === 'warning' ? 'aman' : 'warning';

    const updatedList = patients.map(p => 
      p.id === patientId ? { ...p, status_warning: newWarning, updated_at: new Date().toISOString() } : p
    );
    saveLocalPatients(updatedList);

    try {
      // Try update Supabase
      await supabase.from('patients').update({ status_warning: newWarning, updated_at: new Date().toISOString() }).eq('id', patientId);
    } catch (e) {
      console.warn('Supabase update warning error:', e);
    }
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Status warning diubah menjadi: ${newWarning === 'warning' ? 'Warning' : 'Aman'}`,
      showConfirmButton: false,
      timer: 1500
    });
  };

  const handleDocChecklistChange = async (patientId: string, docType: 'doc_spr' | 'doc_ktp' | 'doc_kk', value: boolean) => {
    const updatedList = patients.map(p => 
      p.id === patientId ? { ...p, [docType]: value, updated_at: new Date().toISOString() } : p
    );
    saveLocalPatients(updatedList);

    try {
      // Try update Supabase
      await supabase.from('patients').update({ [docType]: value, updated_at: new Date().toISOString() }).eq('id', patientId);
    } catch (e) {
      console.warn('Supabase update doc error:', e);
    }
  };

  const handleApprove = async (id: string) => {
    const result = await Swal.fire({
      title: 'Setujui Pengajuan?',
      text: 'Pasien akan disetujui menjadi Peserta BPJS PBI.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Setujui!'
    });

    if (result.isConfirmed) {
      const updatedList = patients.map(p => 
        p.id === id ? { ...p, status_pengajuan: 'Disetujui', penyebab_penolakan: '', updated_at: new Date().toISOString() } : p
      );
      saveLocalPatients(updatedList);

      try {
        // Try update Supabase
        await supabase.from('patients').update({ status_pengajuan: 'Disetujui', penyebab_penolakan: '', updated_at: new Date().toISOString() }).eq('id', id);
      } catch (e) {
        console.warn('Supabase approve error:', e);
      }

      Swal.fire('Disetujui!', 'Status pengajuan berhasil diubah menjadi Disetujui.', 'success');
    }
  };

  const handleReject = async (id: string) => {
    const patient = patients.find(p => p.id === id);
    const existingReason = patient?.penyebab_penolakan || '';

    const { value: reason } = await Swal.fire({
      title: 'Tolak Pengajuan',
      input: 'text',
      inputValue: existingReason,
      inputLabel: 'Masukkan alasan pengajuan ditolak:',
      inputPlaceholder: 'Contoh: Dokumen KK tidak lengkap / buram',
      inputValidator: (value) => {
        if (!value) {
          return 'Alasan penolakan wajib diisi!';
        }
      },
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Tolak!'
    });

    if (reason) {
      const updatedList = patients.map(p => 
        p.id === id ? { ...p, status_pengajuan: 'Ditolak', penyebab_penolakan: reason, updated_at: new Date().toISOString() } : p
      );
      saveLocalPatients(updatedList);

      try {
        // Try update Supabase
        await supabase.from('patients').update({ status_pengajuan: 'Ditolak', penyebab_penolakan: reason, updated_at: new Date().toISOString() }).eq('id', id);
      } catch (e) {
        console.warn('Supabase reject error:', e);
      }

      Swal.fire('Ditolak!', 'Status pengajuan berhasil diubah menjadi Ditolak.', 'error');
    }
  };

  const handleSaveAlasanPenolakan = async (id: string, reason: string) => {
    const updatedList = patients.map(p => 
      p.id === id ? { ...p, penyebab_penolakan: reason, updated_at: new Date().toISOString() } : p
    );
    saveLocalPatients(updatedList);
    try {
      await supabase.from('patients').update({ penyebab_penolakan: reason, updated_at: new Date().toISOString() }).eq('id', id);
    } catch (e) {
      console.warn('Supabase save reason error:', e);
    }
  };

  const handleSaveTidakAdaJknKis = async (id: string, value: string) => {
    const numVal = value === '' ? 0 : parseInt(value, 10);
    const cleanVal = isNaN(numVal) ? 0 : numVal;
    const updatedList = patients.map(p => 
      p.id === id ? { ...p, tidak_ada_jkn_kis: cleanVal, updated_at: new Date().toISOString() } : p
    );
    saveLocalPatients(updatedList);
    try {
      const { error } = await supabase.from('patients').update({ tidak_ada_jkn_kis: cleanVal, updated_at: new Date().toISOString() }).eq('id', id);
      if (error && (error.message?.includes('tidak_ada_jkn_kis') || error.code === '42703')) {
        console.warn('Column tidak_ada_jkn_kis does not exist. Retrying update with updated_at only...');
        await supabase.from('patients').update({ updated_at: new Date().toISOString() }).eq('id', id);
      }
    } catch (e) {
      console.warn('Supabase save tidak_ada_jkn_kis error:', e);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nik?.includes(searchTerm) ||
    p.no_spr?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get active selected patient
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0] || null;

  // Auto set first patient as selected if none is selected
  useEffect(() => {
    if (filteredPatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(filteredPatients[0].id);
    }
  }, [filteredPatients, selectedPatientId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monitoring & Verifikasi Pengajuan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Verifikasi berkas secara langsung, kelola ceklis dokumen, dan edit status warning</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama, NIK, No SPR..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          * Klik baris pasien untuk membuka sidebar status kelengkapan dokumen.
        </div>
      </div>

      {/* Split screen table + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table list - Left (lg:col-span-2) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status Warning</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal SPR</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">No SPR</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tidak Ada JKN-KIS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama / NIK</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                    </td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      Tidak ada pengajuan ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const warningVal = getWarningStatus(patient);
                    const isSelected = selectedPatientId === patient.id;
                    return (
                      <tr 
                        key={patient.id} 
                        onClick={() => setSelectedPatientId(patient.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-l-4 border-indigo-600' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWarning(patient.id);
                            }}
                            className="focus:outline-none group text-left"
                            title="Klik untuk ubah status warning secara manual"
                          >
                            {warningVal === 'warning' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 group-hover:bg-amber-200">
                                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400 animate-pulse" />
                                Warning (Manual)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 group-hover:bg-green-200">
                                Aman / Selesai
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                          {patient.tanggal_spr}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {patient.no_spr}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="number"
                            min="0"
                            value={patient.tidak_ada_jkn_kis !== undefined && patient.tidak_ada_jkn_kis !== null ? patient.tidak_ada_jkn_kis : ''}
                            onChange={(e) => handleSaveTidakAdaJknKis(patient.id, e.target.value)}
                            placeholder="0"
                            className="w-48 px-2.5 py-1 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                          <div className="font-semibold text-gray-900 dark:text-white">{patient.nama}</div>
                          <div className="text-xs text-gray-500">NIK: {patient.nik}</div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${patient.status_pengajuan === 'Disetujui' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                              patient.status_pengajuan === 'Ditolak' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                              patient.status_pengajuan === 'Menunggu Verifikasi' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {patient.status_pengajuan}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleApprove(patient.id)}
                              className="inline-flex items-center px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors"
                              title="Setujui"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleReject(patient.id)}
                              className="inline-flex items-center px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors"
                              title="Tolak"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Monitoring Pengajuan - Right (lg:col-span-1) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col justify-between">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                  <Activity className="w-4 h-4" />
                  <span>Detail Verifikator</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedPatient.nama}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">NIK: {selectedPatient.nik}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">No SPR: {selectedPatient.no_spr}</p>
              </div>

              {/* Status Warning Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  1. Status Warning Sistem (Manual)
                </label>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Warning Status</span>
                  <button
                    onClick={() => handleToggleWarning(selectedPatient.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      getWarningStatus(selectedPatient) === 'warning'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/20 dark:text-green-400'
                    }`}
                  >
                    {getWarningStatus(selectedPatient) === 'warning' ? '⚠️ WARNING (Klik untuk Ubah)' : '✅ AMAN (Klik untuk Ubah)'}
                  </button>
                </div>
              </div>

              {/* Document Checklist Section */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  2. Status Kelengkapan Dokumen (Ceklis)
                </label>
                <div className="space-y-2.5 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  {[
                    { key: 'doc_spr', label: 'Surat Permintaan Rujukan (SPR)' },
                    { key: 'doc_ktp', label: 'Kartu Tanda Penduduk (KTP)' },
                    { key: 'doc_kk', label: 'Kartu Keluarga (KK)' }
                  ].map((doc) => {
                    const isChecked = !!selectedPatient[doc.key];
                    return (
                      <label 
                        key={doc.key} 
                        className="flex items-center space-x-3 cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleDocChecklistChange(selectedPatient.id, doc.key as any, e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{doc.label}</span>
                      </label>
                    );
                  })}
                </div>
                {/* Visual completion progress */}
                <div className="px-1 text-[11px] font-medium text-gray-500 flex justify-between items-center">
                  <span>Dokumen Lengkap:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {[selectedPatient.doc_spr, selectedPatient.doc_ktp, selectedPatient.doc_kk].filter(Boolean).length} / 3
                  </span>
                </div>
              </div>

              {/* Alasan Pengajuan Ditolak Input Field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  3. Alasan Pengajuan Ditolak (Jika Ada)
                </label>
                <textarea
                  value={selectedPatient.penyebab_penolakan || ''}
                  onChange={(e) => handleSaveAlasanPenolakan(selectedPatient.id, e.target.value)}
                  placeholder="Masukkan alasan jika pengajuan ditolak/kurang lengkap..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  4. Keputusan Akhir Verifikasi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleApprove(selectedPatient.id)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    Setujui Berkas
                  </button>
                  <button
                    onClick={() => handleReject(selectedPatient.id)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    <X className="w-4 h-4" />
                    Tolak Berkas
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
              <Clock className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm font-semibold">Tidak ada data pasien</p>
              <p className="text-xs text-gray-400 mt-1">Harap tambahkan data pasien terlebih dahulu.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
