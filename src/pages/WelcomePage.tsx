import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Clock, ShieldCheck, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WelcomePage() {
  const [time, setTime] = useState(new Date());
  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop');
  const [instansi, setInstansi] = useState('RSUD Al-Mulk');
  const [welcomeTitle, setWelcomeTitle] = useState('Sukabumi');
  const [welcomeDesc, setWelcomeDesc] = useState('Platform digital terpadu untuk pencatatan, monitoring, pelaporan, dan evaluasi pengajuan pasien menjadi peserta BPJS PBI secara cepat, akurat, aman, dan real-time.');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Load configurable landing page settings
    const savedBg = localStorage.getItem('care_pbi_welcome_bg');
    if (savedBg) setBgImage(savedBg);

    const savedInstansi = localStorage.getItem('care_pbi_instansi');
    if (savedInstansi) {
      // Remove "Kota Sukabumi" or clean for short display
      setInstansi(savedInstansi.replace(' Kota Sukabumi', '').trim());
    }

    const savedTitle = localStorage.getItem('care_pbi_welcome_title');
    if (savedTitle) setWelcomeTitle(savedTitle);

    const savedDesc = localStorage.getItem('care_pbi_welcome_desc');
    if (savedDesc) setWelcomeDesc(savedDesc);

    return () => clearInterval(timer);
  }, []);

  // Auto detect if background is a video (MP4/WebM or data:video)
  const isVideo = bgImage.toLowerCase().endsWith('.mp4') || 
                  bgImage.toLowerCase().includes('.mp4') || 
                  bgImage.startsWith('data:video/') ||
                  bgImage.includes('mixkit.co/videos/');

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col relative overflow-hidden">
      {/* Background Media with Overlay */}
      <div className="absolute inset-0 z-0 opacity-75 transition-all duration-700">
        {isVideo ? (
          <video
            src={bgImage}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/45 to-transparent"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Activity className="h-8 w-8 text-blue-400" />
          <span className="text-xl font-bold tracking-tight">{instansi}</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center text-sm font-mono text-blue-200 bg-blue-900/30 px-3 py-1 rounded-full border border-blue-500/30">
            <Clock className="w-4 h-4 mr-2" />
            {time.toLocaleTimeString()}
          </div>
          <Link to="/login" className="text-sm font-medium hover:text-blue-400 transition-colors">
            Login Pegawai
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex items-end justify-start px-6 lg:px-20 pb-12 md:pb-20">
        <div className="max-w-xl w-full text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-blue-400 font-semibold tracking-wide uppercase text-xs mb-2 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              Sistem Informasi Rumah Sakit
            </h2>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-2">
              CARE-PBI <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {welcomeTitle}
              </span>
            </h1>
            <p className="text-sm md:text-base text-gray-300 mb-6 font-medium">
              (Conversion dan Reporting Engine PBI)
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/25 w-fit"
              >
                Masuk ke Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-sm text-gray-500 border-t border-white/10 backdrop-blur-sm bg-black/20">
        &copy; {new Date().getFullYear()} {instansi}. All rights reserved.
      </footer>
    </div>
  );
}
