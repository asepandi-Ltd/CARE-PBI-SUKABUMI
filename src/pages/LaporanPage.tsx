import { useState, useEffect } from 'react';
import { supabase, getLocalPatients, fetchAndSyncPatients } from '../lib/supabase';
import { FileText, Download, Search, Printer, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function LaporanPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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

  // Filter logic
  const filteredPatients = patients.filter((patient) => {
    if (!patient.tanggal_spr) return true;
    const date = new Date(patient.tanggal_spr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());

    const matchesBulan = filterBulan ? month === filterBulan : true;
    const matchesTahun = filterTahun ? year === filterTahun : true;
    const matchesStatus = filterStatus ? patient.status_pengajuan === filterStatus : true;

    return matchesBulan && matchesTahun && matchesStatus;
  });

  // Calculate rekap statistics
  const totalDiajukan = filteredPatients.length;
  const totalDisetujui = filteredPatients.filter(p => p.status_pengajuan === 'Disetujui').length;
  const totalDitolak = filteredPatients.filter(p => p.status_pengajuan === 'Ditolak').length;
  const totalMenunggu = filteredPatients.filter(p => p.status_pengajuan === 'Menunggu Verifikasi').length;
  const totalDraft = filteredPatients.filter(p => p.status_pengajuan === 'Draft').length;

  const handleExportExcel = () => {
    if (filteredPatients.length === 0) {
      Swal.fire('Informasi', 'Tidak ada data untuk diekspor', 'info');
      return;
    }

    // Generate CSV
    const headers = ['No', 'Tanggal SPR', 'No SPR', 'Nama Pasien', 'NIK', 'No KK', 'Cara Bayar', 'Jenis Pasien', 'Status', 'Alasan Penolakan'];
    const rows = filteredPatients.map((p, idx) => [
      idx + 1,
      p.tanggal_spr,
      p.no_spr,
      `"${p.nama}"`,
      `'${p.nik}`,
      `'${p.no_kk}`,
      p.cara_bayar,
      p.jenis_pasien,
      p.status_pengajuan,
      `"${p.penyebab_penolakan || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Laporan_CARE_PBI_${filterBulan || 'Semua'}_${filterTahun || 'Semua'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    Swal.fire('Berhasil', 'Laporan berhasil diunduh dalam format Excel (CSV)', 'success');
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-0 print:bg-white print:text-black">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rekap Laporan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Unduh & cetak data rekap pengajuan BPJS PBI</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-4 h-4 mr-2 text-green-600" />
            Ekspor Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak / PDF
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center print:hidden">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter Periode:</span>
        </div>
        <select
          value={filterBulan}
          onChange={(e) => setFilterBulan(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">Semua Bulan</option>
          <option value="01">Januari</option>
          <option value="02">Februari</option>
          <option value="03">Maret</option>
          <option value="04">April</option>
          <option value="05">Mei</option>
          <option value="06">Juni</option>
          <option value="07">Juli</option>
          <option value="08">Agustus</option>
          <option value="09">September</option>
          <option value="10">Oktober</option>
          <option value="11">November</option>
          <option value="12">Desember</option>
        </select>

        <select
          value={filterTahun}
          onChange={(e) => setFilterTahun(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">Semua Tahun</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">Semua Status Pengajuan</option>
          <option value="Draft">Draft</option>
          <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Ditolak">Ditolak</option>
        </select>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">RSUD AL-MULK KOTA SUKABUMI</h2>
        <p className="text-sm text-gray-600">Sistem CARE-PBI (Conversion & Reporting Engine PBI)</p>
        <p className="text-xs text-gray-500 mt-1">Laporan Pengajuan Pasien BPJS PBI - Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
        <div className="border-b-2 border-gray-800 mt-4"></div>
      </div>

      {/* Recaps cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Diajukan', value: totalDiajukan, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10' },
          { label: 'Disetujui', value: totalDisetujui, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
          { label: 'Ditolak', value: totalDitolak, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/10' },
          { label: 'Menunggu Verif', value: totalMenunggu, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
          { label: 'Draft', value: totalDraft, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800/50' },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.bg} p-4 rounded-xl border border-gray-100 dark:border-gray-700/50`}>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table block */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">No</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal SPR</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">No SPR</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Pasien</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">NIK</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cara Bayar</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alasan Penolakan</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    Tidak ada data rekap ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, index) => (
                  <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {patient.tanggal_spr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      {patient.no_spr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      {patient.nama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {patient.nik}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {patient.cara_bayar}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${patient.status_pengajuan === 'Disetujui' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          patient.status_pengajuan === 'Ditolak' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                          patient.status_pengajuan === 'Menunggu Verifikasi' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {patient.status_pengajuan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400">
                      {patient.penyebab_penolakan || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
