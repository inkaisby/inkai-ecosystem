"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, MessageCircle, QrCode, Wallet, BookOpen, ShoppingBag, Award, Scroll, GraduationCap, ArrowRightLeft, FileText, CalendarCheck, ChevronRight, Trophy, Loader2, Lock, ShieldCheck } from "lucide-react";
import styles from "./Dashboard.module.css";
import MemberCard from "@/components/MemberCard/MemberCard";
import BottomNav from "@/components/BottomNav/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { eventApi, getAssetUrl } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading, isProfileComplete, isDocumentComplete } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    } else if (user) {
      fetchEvents();
    }
  }, [user, isAuthLoading, router]);

  const fetchEvents = async () => {
    try {
      const [upcomingRes, myEventsRes] = await Promise.all([
        eventApi.getEvents(),
        eventApi.getMyEvents()
      ]);
      
      if (upcomingRes.data.status === 'success') {
        setUpcomingEvents(upcomingRes.data.data.slice(0, 3));
      }
      if (myEventsRes.data.status === 'success') {
        setMyEvents(myEventsRes.data.data || []);
      }
    } catch (error) {
      console.error("Fetch events error:", error);
    } finally {
      setIsEventsLoading(false);
    }
  };

  const quickActions = [
    { icon: <QrCode size={24} />, label: "Absensi", path: "/absensi" },
    { icon: <Wallet size={24} />, label: "Iuran", path: "/billing" },
    { icon: <BookOpen size={24} />, label: "Materi", path: "/library" },
    { icon: <ShoppingBag size={24} />, label: "Store", path: "/store" },
    { icon: <Award size={24} />, label: "Sabuk", path: "/achievement?tab=Sabuk" },
    { icon: <Scroll size={24} />, label: "Piagam", path: "/achievement?tab=Piagam" },
    { icon: <GraduationCap size={24} />, label: "Pelatihan", path: "/achievement?tab=Pelatihan" },
    { icon: <ArrowRightLeft size={24} />, label: "Pindah", path: "/transfer" },
    { icon: <FileText size={24} />, label: "Dokumen", path: "/documents" },
    { icon: <CalendarCheck size={24} />, label: "Event", path: "/events" },
  ];

  if (!mounted || isAuthLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  const renderEventItem = (event: any, isHistory = false) => {
    const isUKT = event.title?.toUpperCase().includes('UKT') || event.title?.toUpperCase().includes('UJIAN');
    return (
      <motion.div 
        key={event.id} 
        whileHover={{ x: 5 }}
        className="premium-glass inner-glow p-5 rounded-[2rem] flex items-center gap-5 cursor-pointer border-white/5 mb-4" 
        onClick={() => router.push(`/events/${event.id}`)}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isUKT ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-500'}`}>
          {isUKT ? <Award size={24} /> : <Trophy size={24} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black uppercase text-white truncate mb-1">{event.title}</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            {new Date(event.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} | {event.location || 'Indonesia'}
          </p>
          {isHistory && event.registrationStatus && (
             <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${event.registrationStatus === 'PAID' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-500'}`}>
                {event.registrationStatus === 'PAID' ? 'LUNAS' : 'PENDING'}
             </span>
          )}
        </div>
        <ChevronRight size={16} className="text-gray-600" />
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-x-hidden pb-32">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <header className="px-6 pt-10 pb-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-[-4px] bg-gradient-to-r from-amber-500 to-amber-600 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
            <div className="w-12 h-12 rounded-full p-[2px] bg-white/5 border border-white/10 relative">
              <img 
                src={user?.photoUrl ? getAssetUrl(user.photoUrl) : "/logo.png"} 
                alt={user?.fullName || "Member"} 
                className="w-full h-full rounded-full object-cover" 
              />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-white leading-tight">
              OSS, {user.fullName ? user.fullName.split(' ')[0] : 'MEMBER'}!
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500">
                {(user.roles?.includes('ADMINISTRATOR') || (Array.isArray(user.roles) && user.roles.some((r: any) => r === 'ADMINISTRATOR' || r.name === 'ADMINISTRATOR')))
                  ? 'Administrator' 
                  : (user.status === 'PENDING' ? 'ANGGOTA PENDING' : 'ANGGOTA AKTIF')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all" onClick={() => router.push("/notifications")}>
            <Bell size={18} />
          </button>
          <button className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all" onClick={() => { logout(); router.push("/"); }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 space-y-10 z-10">
        {user.status === 'PENDING' && (
          <section className="premium-glass inner-glow p-6 rounded-[2rem] border-amber-500/20 bg-amber-500/[0.03]">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-500 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-white">AKUN DALAM VERIFIKASI</h3>
                <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-wider">
                  Pemberitahuan telah dikirimkan ke <b>Ketua Ranting</b> Anda untuk proses aktivasi NIA.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Member Card Section */}
        <section>
          <MemberCard 
            nia={user.nia || "MEMPROSES NIA..."} 
            name={user.fullName || "ANGGOTA INKAI"} 
            dojo={user.dojo ? `${user.dojo.name} - ${user.dojo.branch?.province?.name || 'PUSAT'}` : 'DOJO INKAI - PUSAT'} 
            qrValue={typeof window !== 'undefined' ? `${window.location.origin}/v/${user.nia || user.id}` : user.id}
          />
        </section>

        {/* Quick Actions Grid */}
        <section>
          <div className="grid grid-cols-5 gap-y-8 gap-x-4">
            {quickActions.map((action, i) => (
              <motion.div 
                key={action.label}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-3 cursor-pointer group"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(action.path)}
              >
                <div className="w-14 h-14 rounded-[1.25rem] bg-white/[0.03] border border-white/5 flex items-center justify-center text-amber-500/60 group-hover:text-amber-500 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all shadow-lg inner-glow">
                  {action.icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">{action.label}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* My Events Section */}
        {myEvents.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 ml-1">KEGIATAN SAYA</h2>
            <div className="eventList">
              {myEvents.map(event => renderEventItem(event, true))}
            </div>
          </section>
        )}

        {/* Upcoming Events Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">EVENT TERDEKAT</h2>
            <button className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 hover:text-amber-500 transition-colors" onClick={() => router.push("/events")}>LIHAT SEMUA</button>
          </div>
          
          <div className="space-y-4">
            {!user.nia ? (
              <div className="premium-glass inner-glow p-12 rounded-[2.5rem] flex flex-col items-center text-center gap-4 border-dashed border-white/10">
                 <Lock size={32} className="text-white/10" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 leading-relaxed">
                   Event terdekat belum dapat diakses.<br/>
                   Tunggu sampai <span className="text-amber-500">NIA</span> Anda aktif untuk mendaftar.
                 </p>
              </div>
            ) : isEventsLoading ? (
               <div className="flex justify-center p-10"><Loader2 className="animate-spin text-amber-500" size={24} /></div>
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => renderEventItem(event))
            ) : (
              <div className="premium-glass inner-glow p-10 rounded-[2.5rem] text-center text-[10px] font-black uppercase tracking-widest text-gray-600">
                Belum ada event terdekat.
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNav />

      {/* Completion Overlay */}
      <AnimatePresence>
        {(!isProfileComplete || !isDocumentComplete) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="premium-glass inner-glow w-full max-w-sm p-10 rounded-[2.5rem] border-white/10 text-center"
            >
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-2xl shadow-amber-500/20">
                <Award size={40} />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white mb-3">
                {!isProfileComplete ? 'Profil Belum Lengkap' : 'Dokumen Belum Lengkap'}
              </h2>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-relaxed mb-8 opacity-80">
                {!isProfileComplete 
                  ? 'Lengkapi data diri Anda (Foto, No WA, Tempat & Tanggal Lahir, Alamat, serta Dojo/Ranting) untuk menggunakan fitur INKAI Mobile.'
                  : 'Data diri lengkap. Sekarang silakan lengkapi Dokumen Keanggotaan Anda (Akte Kelahiran & BPJS).'}
              </p>
              <button 
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all text-xs" 
                onClick={() => router.push(!isProfileComplete ? '/profile/edit' : '/documents')}
              >
                {!isProfileComplete ? 'LENGKAPI PROFIL' : 'LENGKAPI DOKUMEN'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
