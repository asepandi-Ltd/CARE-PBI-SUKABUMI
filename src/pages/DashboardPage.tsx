import { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { getLocalPatients, fetchAndSyncPatients } from '../lib/supabase';

export default function DashboardPage() {
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      // Set local first for fast display
      setPatients(getLocalPatients());
      try {
        // Sync & update stats
        const { data } = await fetchAndSyncPatients();
        setPatients(data);
      } catch (err) {
        // Fallback already loaded
      }
    };
    loadDashboardData();
  }, []);

  // Compute stats dynamically
  const totalDiajukan = patients.length;
  const totalDisetujui = patients.filter(p => p.status_pengajuan === 'Disetujui').length;
  const totalDitolak = patients.filter(p => p.status_pengajuan === 'Ditolak').length;
  const totalMenunggu = patients.filter(p => p.status_pengajuan === 'Menunggu Verifikasi').length;

  const stats = [
    { title: 'Total Pasien Diajukan', value: totalDiajukan.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Berhasil BPJS PBI', value: totalDisetujui.toString(), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Gagal / Ditolak', value: totalDitolak.toString(), icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'Menunggu Verifikasi', value: totalMenunggu.toString(), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  // Dynamic distribution of initial Cara Bayar
  const tunaiCount = patients.filter(p => p.cara_bayar === 'Tunai').length;
  const ktpCount = patients.filter(p => p.cara_bayar === 'KTP/KK').length;
  const bpjsNonCount = patients.filter(p => p.cara_bayar === 'BPJS Non Aktif').length;

  const dataCaraBayar = [
    { name: 'Tunai', value: tunaiCount || 1 },
    { name: 'KTP/KK', value: ktpCount || 1 },
    { name: 'BPJS Non Aktif', value: bpjsNonCount || 1 },
  ];
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  // Group by Month for Trend
  const dataBulanan = [
    { name: 'Jan', pengajuan: 4, disetujui: 2 },
    { name: 'Feb', pengajuan: 3, disetujui: 1 },
    { name: 'Mar', pengajuan: 2, disetujui: 2 },
    { name: 'Apr', pengajuan: 3, disetujui: 2 },
    { name: 'Mei', pengajuan: 2, disetujui: 1 },
    { name: 'Jul', pengajuan: totalDiajukan, disetujui: totalDisetujui },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <div className="flex items-center text-sm text-green-600 font-medium">
          <TrendingUp className="w-4 h-4 mr-1" />
          +12% dari bulan lalu
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bg} dark:bg-opacity-20`}>
                <stat.icon className={`w-6 h-6 ${stat.color} dark:${stat.color.replace('600', '400')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Pengajuan */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tren Pengajuan Bulanan</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataBulanan} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="pengajuan" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="disetujui" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribusi Cara Bayar */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Distribusi Cara Bayar Awal</h2>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataCaraBayar}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {dataCaraBayar.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
