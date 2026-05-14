'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  MapPin, 
  Clock, 
  AlertCircle,
  History,
  ChevronLeft
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AttendanceScannerPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanner = () => {
    setScanning(true);
    setResult(null);
    
    // Small delay to ensure the DOM element is ready
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        async (decodedText) => {
          // Success! Stop scanner and process
          await html5QrCode.stop();
          setScanning(false);
          handleCheckIn(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      ).catch((err) => {
        console.error(err);
        toast.error("Gagal mengakses kamera");
        setScanning(false);
      });
    }, 300);
  };

  const handleCheckIn = async (qrData: string) => {
    setLoading(true);
    
    // Get current location first
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await api.attendance.checkIn({ 
            dojoId: qrData,
            latitude,
            longitude
          });
          setResult({
            success: true,
            message: response.message,
            dojoName: response.data.dojo.name,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          });
          toast.success("Absensi Berhasil!");
        } catch (err: any) {
          setResult({
            success: false,
            message: err.response?.data?.message || "Gagal memproses absensi"
          });
          toast.error("Gagal Absen");
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setLoading(false);
        setResult({
          success: false,
          message: "Akses lokasi ditolak atau tidak tersedia. Pastikan GPS aktif untuk melakukan absensi."
        });
        toast.error("GPS Dibutuhkan");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white px-0 py-8 pb-28 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/dashboard')}
          className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight leading-tight">Presensi Digital</h1>
          <div className="flex items-center gap-2 text-amber-500 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Real-time Validation</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {!scanning && !result && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 text-center space-y-8 border-white/5"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/20">
              <Camera size={40} className="text-black" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Siap Latihan?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Pindai Kode QR yang tersedia di Dojo untuk mencatat kehadiran Anda hari ini.</p>
            </div>
            <button 
              onClick={startScanner}
              className="w-full btn-primary py-5 text-sm font-black uppercase tracking-[0.2em]"
            >
              Mulai Pindai QR
            </button>
          </motion.div>
        )}

        {scanning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div id="reader" className="overflow-hidden rounded-3xl border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10" />
            <button 
              onClick={() => {
                if (scannerRef.current) scannerRef.current.stop();
                setScanning(false);
              }}
              className="mt-6 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-gray-400"
            >
              Batalkan
            </button>
          </motion.div>
        )}

        {loading && (
          <div className="glass-card p-20 flex flex-col items-center justify-center gap-4 border-white/5">
            <Loader2 className="animate-spin text-amber-500" size={48} />
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 animate-pulse">Memvalidasi Data...</p>
          </div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card p-8 text-center space-y-6 border-2 ${result.success ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 ${result.success ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              {result.success ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
            </div>
            
            <div className="space-y-1">
              <h3 className={`text-xl font-black uppercase ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                {result.success ? 'Absensi Sukses!' : 'Absensi Gagal'}
              </h3>
              <p className="text-xs text-gray-400">{result.message}</p>
            </div>

            {result.success && (
              <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                <div className="text-left space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 block">Dojo</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <MapPin size={14} className="text-amber-500" /> {result.dojoName}
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 block">Waktu</span>
                  <span className="text-sm font-bold text-white flex items-center justify-end gap-1.5">
                    <Clock size={14} className="text-amber-500" /> {result.time}
                  </span>
                </div>
              </div>
            )}

            <button 
              onClick={() => setResult(null)}
              className="w-full btn-secondary py-4 text-xs font-bold"
            >
              Tutup
            </button>
          </motion.div>
        )}
      </div>

      {/* Info Card */}
      {!scanning && !result && (
        <div className="glass-card bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/10 p-6 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Penting!</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Pastikan Anda berada di area Dojo saat memindai. Sistem menggunakan deteksi lokasi untuk memvalidasi kehadiran fisik Anda.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
