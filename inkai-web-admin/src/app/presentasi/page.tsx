export default function PresentationPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] -m-4">
      <div className="mb-4 px-4 pt-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Presentasi & Panduan Ekosistem INKAI</h2>
          <p className="text-sm text-gray-400">Gunakan halaman ini untuk menjelaskan alur sistem ke Anggota, Ketua Ranting, Pengprov, hingga PP Pusat secara interaktif.</p>
        </div>
        <a 
          href="/presentation.html" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-600 transition-colors"
        >
          Buka Layar Penuh (Tab Baru)
        </a>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden border border-white/10 relative shadow-2xl shadow-amber-500/5">
        <iframe 
          src="/presentation.html" 
          className="w-full h-full border-0 absolute inset-0" 
          title="Presentasi INKAI Digital"
          allowFullScreen
        />
      </div>
    </div>
  );
}
