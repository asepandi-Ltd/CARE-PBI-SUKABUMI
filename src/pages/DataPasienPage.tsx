import { useState, useEffect } from 'react';
import { 
  getLocalPatients, 
  setLocalPatients, 
  fetchAndSyncPatients, 
  generateUUID, 
  savePatientToRemote, 
  deletePatientFromRemote, 
  normalizeDesil, 
  normalizeRuangan, 
  normalizeStatusKK 
} from '../lib/supabase';
import { Plus, Search, Filter, Edit, Trash2, FileText, Download, X, Calendar, User, CreditCard, MapPin, Eye, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuthStore } from '../store/authStore';

export default function DataPasienPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCaraBayar, setFilterCaraBayar] = useState('');
  const [filterRuangan, setFilterRuangan] = useState('');
  const [filterDesil, setFilterDesil] = useState('');
  const [filterStatusKK, setFilterStatusKK] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const { profile } = useAuthStore();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    desil: '1',
    no_spr: '1',
    tanggal_spr: '',
    nama: '',
    nik: '',
    no_kk: '',
    status_dalam_kk: 'Sudah Masuk KK',
    alamat: '',
    tanggal_lahir: '',
    no_hp: '',
    cara_bayar: 'KTP/KK',
    nama_ruangan: 'IGD',
    jenis_pasien: 'IGD',
    status_pengajuan: 'Menunggu Verifikasi',
    penyebab_penolakan: ''
  });

  const saveLocalPatients = (updatedList: any[]) => {
    setPatients(updatedList);
    setLocalPatients(updatedList);
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
      const desilVal = normalizeDesil(patient.desil || patient.no_spr);
      const ruanganVal = normalizeRuangan(patient.nama_ruangan || patient.jenis_pasien);
      setFormData({
        desil: desilVal,
        no_spr: desilVal,
        tanggal_spr: patient.tanggal_spr || '',
        nama: patient.nama || '',
        nik: patient.nik || '',
        no_kk: patient.no_kk || '',
        status_dalam_kk: normalizeStatusKK(patient.status_dalam_kk),
        alamat: patient.alamat || '',
        tanggal_lahir: patient.tanggal_lahir || '',
        no_hp: patient.no_hp || '',
        cara_bayar: patient.cara_bayar || 'KTP/KK',
        nama_ruangan: ruanganVal,
        jenis_pasien: ruanganVal,
        status_pengajuan: patient.status_pengajuan || 'Draft',
        penyebab_penolakan: patient.penyebab_penolakan || ''
      });
    } else {
      setFormData({
        desil: '1',
        no_spr: '1',
        tanggal_spr: new Date().toISOString().split('T')[0],
        nama: '',
        nik: '',
        no_kk: '',
        status_dalam_kk: 'Sudah Masuk KK',
        alamat: '',
        tanggal_lahir: '',
        no_hp: '',
        cara_bayar: 'KTP/KK',
        nama_ruangan: 'IGD',
        jenis_pasien: 'IGD',
        status_pengajuan: 'Draft',
        penyebab_penolakan: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'desil') updated.no_spr = value;
      if (name === 'nama_ruangan') updated.jenis_pasien = value;
      return updated;
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const trimmedNama = (formData.nama || '').trim();
    const trimmedNik = (formData.nik || '').trim();
    const trimmedKk = (formData.no_kk || '').trim();

    // NIK is optional, only Nama, No. KK, and Desil are mandatory
    if (!trimmedNama || !trimmedKk || !formData.desil) {
      Swal.fire('Peringatan', 'Harap isi semua kolom wajib (Nama Pasien, No. KK, dan Desil)!', 'warning');
      return;
    }

    // Only validate NIK format if filled
    if (trimmedNik && (trimmedNik.length !== 16 || !/^\d+$/.test(trimmedNik))) {
      Swal.fire('Peringatan', 'Jika NIK diisi, NIK harus terdiri dari tepat 16 digit angka!', 'warning');
      return;
    }

    if (trimmedKk.length !== 16 || !/^\d+$/.test(trimmedKk)) {
      Swal.fire('Peringatan', 'Nomor KK harus terdiri dari tepat 16 digit angka!', 'warning');
      return;
    }

    // Check duplicate NIK across patients only if NIK is provided
    if (trimmedNik) {
      const isDuplicateNik = patients.some(p => 
        p.nik && p.nik === trimmedNik && (!selectedPatient || p.id !== selectedPatient.id)
      );
      if (isDuplicateNik) {
        Swal.fire('Peringatan', `Pasien dengan NIK ${trimmedNik} sudah terdaftar di sistem!`, 'warning');
        return;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const finalTanggalSpr = formData.tanggal_spr || todayStr;
    const finalTanggalLahir = formData.tanggal_lahir || '2000-01-01';

    try {
      if (selectedPatient) {
        // Edit mode
        const updatedPatient = { 
          ...selectedPatient, 
          ...formData, 
          nama: trimmedNama,
          nik: trimmedNik || '',
          no_kk: trimmedKk,
          tanggal_spr: finalTanggalSpr,
          tanggal_lahir: finalTanggalLahir,
          updated_at: new Date().toISOString() 
        };
        const updatedList = patients.map(p => p.id === selectedPatient.id ? updatedPatient : p);
        saveLocalPatients(updatedList);
        setIsModalOpen(false);

        // Remote save in background
        savePatientToRemote(updatedPatient).catch(err => {
          console.warn('Background remote update note:', err);
        });
        
        Swal.fire('Berhasil!', 'Data pasien berhasil diperbarui.', 'success');
      } else {
        // Add mode
        const newId = generateUUID();
        const newPatient = {
          id: newId,
          ...formData,
          nama: trimmedNama,
          nik: trimmedNik || '',
          no_kk: trimmedKk,
          tanggal_spr: finalTanggalSpr,
          tanggal_lahir: finalTanggalLahir,
          status_warning: 'aman',
          doc_spr: false,
          doc_ktp: false,
          doc_kk: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const updatedList = [newPatient, ...patients];
        saveLocalPatients(updatedList);
        setIsModalOpen(false);

        // Remote save in background
        savePatientToRemote(newPatient).catch(err => {
          console.warn('Background remote insert note:', err);
        });

        Swal.fire('Berhasil!', 'Pasien baru berhasil ditambahkan.', 'success');
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', `Terjadi kesalahan saat menyimpan data: ${err.message || err}`, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data pasien akan dihapus secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, hapus!'
    });

    if (result.isConfirmed) {
      const updatedList = patients.filter(p => p.id !== id);
      saveLocalPatients(updatedList);

      // Remote delete in background
      deletePatientFromRemote(id).catch(err => {
        console.warn('Background remote delete note:', err);
      });

      Swal.fire('Terhapus!', 'Data pasien berhasil dihapus.', 'success');
    }
  };

  // Perform client-side filtering on top of fetched patients list
  const filteredPatients = patients.filter(patient => {
    const pDesil = normalizeDesil(patient.desil || patient.no_spr);
    const pRuangan = normalizeRuangan(patient.nama_ruangan || patient.jenis_pasien);
    const pStatusKK = normalizeStatusKK(patient.status_dalam_kk);

    const matchesSearch = 
      patient.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.nik && patient.nik.includes(searchTerm)) ||
      patient.no_kk?.includes(searchTerm) ||
      pStatusKK.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pDesil.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pRuangan.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCaraBayar = filterCaraBayar ? patient.cara_bayar === filterCaraBayar : true;
    const matchesRuangan = filterRuangan ? pRuangan === filterRuangan : true;
    const matchesDesil = filterDesil ? pDesil === filterDesil : true;
    const matchesStatusKK = filterStatusKK ? pStatusKK === filterStatusKK : true;
    const matchesStatus = filterStatus ? patient.status_pengajuan === filterStatus : true;

    return matchesSearch && matchesCaraBayar && matchesRuangan && matchesDesil && matchesStatusKK && matchesStatus;
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
              placeholder="Cari nama, NIK, KK, desil, status KK..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select
              value={filterDesil}
              onChange={(e) => setFilterDesil(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Desil (Semua)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                <option key={d} value={String(d)}>Desil {d}</option>
              ))}
            </select>
            <select
              value={filterRuangan}
              onChange={(e) => setFilterRuangan(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Ruangan (Semua)</option>
              {['IGD', 'Aisyah', 'Fatimah', 'Khadijah', 'Usman'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={filterStatusKK}
              onChange={(e) => setFilterStatusKK(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Status KK (Semua)</option>
              <option value="Sudah Masuk KK">Sudah Masuk KK</option>
              <option value="Belum Masuk KK">Belum Masuk KK</option>
            </select>
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
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desil</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Pasien / NIK / KK</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status Dalam KK</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Ruangan</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cara Bayar</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                        Desil {normalizeDesil(patient.desil || patient.no_spr)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{patient.nama}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">NIK: {patient.nik || '-'} • KK: {patient.no_kk}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        normalizeStatusKK(patient.status_dalam_kk) === 'Sudah Masuk KK'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                      }`}>
                        {normalizeStatusKK(patient.status_dalam_kk) === 'Sudah Masuk KK' ? '✓ Sudah Masuk KK' : '✕ Belum Masuk KK'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                        {normalizeRuangan(patient.nama_ruangan || patient.jenis_pasien)}
                      </span>
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
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Desil *</label>
                  <select
                    name="desil"
                    disabled={isViewOnly}
                    value={formData.desil}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={String(num)}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tanggal Registrasi *</label>
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
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">NIK Pasien (Opsional)</label>
                  <input
                    type="text"
                    name="nik"
                    disabled={isViewOnly}
                    value={formData.nik}
                    onChange={handleInputChange}
                    maxLength={16}
                    placeholder="16 digit angka (jika ada)"
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
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Status Dalam KK *</label>
                  <select
                    name="status_dalam_kk"
                    disabled={isViewOnly}
                    value={formData.status_dalam_kk}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  >
                    <option value="Sudah Masuk KK">Sudah Masuk KK</option>
                    <option value="Belum Masuk KK">Belum Masuk KK</option>
                  </select>
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
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Nama Ruangan</label>
                  <select
                    name="nama_ruangan"
                    disabled={isViewOnly}
                    value={formData.nama_ruangan}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  >
                    {['IGD', 'Aisyah', 'Fatimah', 'Khadijah', 'Usman'].map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
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

