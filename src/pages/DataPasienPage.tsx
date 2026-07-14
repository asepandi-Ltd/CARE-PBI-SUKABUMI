import { useState, useEffect } from 'react';
import { supabase, getLocalPatients, fetchAndSyncPatients, generateUUID, sanitizePatientForSupabase } from '../lib/supabase';
import { Plus, Search, Filter, Edit, Trash2, FileText, Download, X, Calendar, User, CreditCard, MapPin, Eye, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuthStore } from '../store/authStore';

export default function DataPasienPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCaraBayar, setFilterCaraBayar] = useState('');
  const [filterJenisPasien, setFilterJenisPasien] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const { profile } = useAuthStore();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    no_spr: '',
    tanggal_spr: '',
    nama: '',
    nik: '',
    no_kk: '',
    alamat: '',
    tanggal_lahir: '',
    no_hp: '',
    cara_bayar: 'KTP/KK',
    jenis_pasien: 'Rawat Inap',
    status_pengajuan: 'Menunggu Verifikasi',
    penyebab_penolakan: '',
    tidak_ada_jkn_kis: 0
  });

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

  const handleOpenModal = (patient: any | null = null, viewOnly = false) => {
    setSelectedPatient(patient);
    setIsViewOnly(viewOnly);
    if (patient) {
      setFormData({
        no_spr: patient.no_spr || '',
        tanggal_spr: patient.tanggal_spr || '',
        nama: patient.nama || '',
        nik: patient.nik || '',
        no_kk: patient.no_kk || '',
        alamat: patient.alamat || '',
        tanggal_lahir: patient.tanggal_lahir || '',
        no_hp: patient.no_hp || '',
        cara_bayar: patient.cara_bayar || 'KTP/KK',
        jenis_pasien: patient.jenis_pasien || 'Rawat Inap',
        status_pengajuan: patient.status_pengajuan || 'Draft',
        penyebab_penolakan: patient.penyebab_penolakan || '',
        tidak_ada_jkn_kis: patient.tidak_ada_jkn_kis || 0
      });
    } else {
      setFormData({
        no_spr: `SPR/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
        tanggal_spr: new Date().toISOString().split('T')[0],
        nama: '',
        nik: '',
        no_kk: '',
        alamat: '',
        tanggal_lahir: '',
        no_hp: '',
        cara_bayar: 'KTP/KK',
        jenis_pasien: 'Rawat Inap',
        status_pengajuan: 'Draft',
        penyebab_penolakan: '',
        tidak_ada_jkn_kis: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!formData.nama || !formData.nik || !formData.no_kk || !formData.no_spr) {
      Swal.fire('Peringatan', 'Harap isi semua kolom wajib!', 'warning');
      return;
    }

    try {
      if (selectedPatient) {
        // Edit mode
        const updatedPatient = { 
          ...selectedPatient, 
          ...formData, 
          updated_at: new Date().toISOString() 
        };
        const updatedList = patients.map(p => p.id === selectedPatient.id ? updatedPatient : p);
        saveLocalPatients(updatedList);
        
        // Try real Supabase safely
        try {
          const sanitized = sanitizePatientForSupabase(updatedPatient);
          const { error } = await supabase.from('patients').update(sanitized).eq('id', selectedPatient.id);
          if (error) console.warn('Supabase edit warning:', error.message);
        } catch (supabaseErr) {
          console.warn('Supabase connection or table not found, saved to local storage:', supabaseErr);
        }
        
        Swal.fire('Berhasil!', 'Data pasien berhasil diperbarui.', 'success');
      } else {
        // Add mode
        const newId = generateUUID();
        const newPatient = {
          id: newId,
          ...formData,
          status_warning: 'aman',
          doc_spr: false,
          doc_ktp: false,
          doc_kk: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const updatedList = [newPatient, ...patients];
        saveLocalPatients(updatedList);

        // Try real Supabase safely
        try {
          const sanitized = sanitizePatientForSupabase(newPatient);
          const { error } = await supabase.from('patients').insert([sanitized]);
          if (error) console.warn('Supabase insert warning:', error.message);
        } catch (supabaseErr) {
          console.warn('Supabase connection or table not found, saved to local storage:', supabaseErr);
        }

        Swal.fire('Berhasil!', 'Pasien baru berhasil ditambahkan.', 'success');
      }
      setIsModalOpen(false);
      fetchPatients();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Terjadi kesalahan saat memproses data.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data pasien akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, hapus!'
    });

    if (result.isConfirmed) {
      const updatedList = patients.filter(p => p.id !== id);
      saveLocalPatients(updatedList);

      // Try real Supabase safely
      try {
        const { error } = await supabase.from('patients').delete().eq('id', id);
        if (error) console.warn('Supabase delete warning:', error.message);
      } catch (supabaseErr) {
        console.warn('Supabase connection or table not found, deleted locally:', supabaseErr);
      }

      Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
      fetchPatients();
    }
  };

  // Perform client-side filtering on top of fetched patients list
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.nik?.includes(searchTerm) ||
      patient.no_spr?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCaraBayar = filterCaraBayar ? patient.cara_bayar === filterCaraBayar : true;
    const matchesJenisPasien = filterJenisPasien ? patient.jenis_pasien === filterJenisPasien : true;
    const matchesStatus = filterStatus ? patient.status_pengajuan === filterStatus : true;

    return matchesSearch && matchesCaraBayar && matchesJenisPasien && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Pasien</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pencatatan & konversi pasien ke BPJS PBI</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pasien
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
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
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={filterCaraBayar}
              onChange={(e) => setFilterCaraBayar(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Cara Bayar (Semua)</option>
              <option value="KTP/KK">KTP/KK</option>
              <option value="Tunai">Tunai</option>
              <option value="BPJS Non Aktif">BPJS Non Aktif</option>
              <option value="BPJS PBI">BPJS PBI</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Status (Semua)</option>
              <option value="Draft">Draft</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">No</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal SPR</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">No SPR</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Pasien / NIK</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jenis Pasien</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cara Bayar</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    Tidak ada data pasien ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, index) => (
                  <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                      {patient.tanggal_spr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      {patient.no_spr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{patient.nama}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">NIK: {patient.nik}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {patient.jenis_pasien}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {patient.cara_bayar}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenModal(patient, true)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" 
                          title="Detail"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(patient, false)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" 
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(patient.id)} 
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" 
                          title="Hapus"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Dialog/Modal for Add/Edit/View */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {isViewOnly ? 'Detail Pasien' : selectedPatient ? 'Edit Data Pasien' : 'Tambah Pasien Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">No SPR *</label>
                  <input
                    type="text"
                    name="no_spr"
                    disabled={isViewOnly}
                    value={formData.no_spr}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tanggal SPR *</label>
                  <input
                    type="date"
                    name="tanggal_spr"
                    disabled={isViewOnly}
                    value={formData.tanggal_spr}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Nama Pasien *</label>
                  <input
                    type="text"
                    name="nama"
                    disabled={isViewOnly}
                    value={formData.nama}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">NIK Pasien *</label>
                  <input
                    type="text"
                    name="nik"
                    disabled={isViewOnly}
                    value={formData.nik}
                    onChange={handleInputChange}
                    maxLength={16}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Nomor KK *</label>
                  <input
                    type="text"
                    name="no_kk"
                    disabled={isViewOnly}
                    value={formData.no_kk}
                    onChange={handleInputChange}
                    maxLength={16}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Nomor HP</label>
                  <input
                    type="text"
                    name="no_hp"
                    disabled={isViewOnly}
                    value={formData.no_hp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tidak Ada JKN-KIS</label>
                  <input
                    type="number"
                    name="tidak_ada_jkn_kis"
                    min="0"
                    disabled={isViewOnly}
                    value={formData.tidak_ada_jkn_kis}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Alamat Lengkap</label>
                <textarea
                  name="alamat"
                  rows={2}
                  disabled={isViewOnly}
                  value={formData.alamat}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    name="tanggal_lahir"
                    disabled={isViewOnly}
                    value={formData.tanggal_lahir}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Cara Bayar</label>
                  <select
                    name="cara_bayar"
                    disabled={isViewOnly}
                    value={formData.cara_bayar}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  >
                    <option value="KTP/KK">KTP/KK</option>
                    <option value="Tunai">Tunai</option>
                    <option value="BPJS Non Aktif">BPJS Non Aktif</option>
                    <option value="BPJS PBI">BPJS PBI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Jenis Pasien</label>
                  <select
                    name="jenis_pasien"
                    disabled={isViewOnly}
                    value={formData.jenis_pasien}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  >
                    <option value="Rawat Inap">Rawat Inap</option>
                    <option value="IGD">IGD</option>
                  </select>
                </div>
              </div>

              {isViewOnly && formData.status_pengajuan === 'Ditolak' && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/30 rounded-lg flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-800 dark:text-red-400 uppercase">Penyebab Penolakan</p>
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">{formData.penyebab_penolakan || 'Tidak disebutkan'}</p>
                  </div>
                </div>
              )}

              {/* Upload Document Previews */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Dokumen Pendukung</p>
                <div className="grid grid-cols-3 gap-3">
                  {['spr', 'ktp', 'kk'].map((doc) => (
                    <div key={doc} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50">
                      <FileText className="w-8 h-8 text-indigo-500 mb-1" />
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{doc}</span>
                      <button 
                        type="button" 
                        onClick={() => Swal.fire('Preview', `Preview dokumen ${doc.toUpperCase()} simulasi`, 'info')}
                        className="mt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Lihat / Unggah
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Tutup
                </button>
                {!isViewOnly && (
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  >
                    Simpan Perubahan
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

