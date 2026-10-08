import { useEffect, useState } from "react";
import EcommerceMetrics from "../../layout/EcommerceMetrics";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  const [nama, setNama] = useState<string | null>(null);

  useEffect(() => {
    const storedNama = localStorage.getItem("nama");
    setNama(storedNama);
  }, []);

  return (
    <>
      <PageMeta
        title="Dashboard Admin | Sistem Informasi Sekolah"
        description="Halaman utama dashboard admin untuk mengelola data sekolah."
      />

      {/* Gunakan container konsisten */}
      <div className="px-6 py-6 space-y-6">
        {/* 🟢 Banner ucapan */}
        <div className="w-full p-6 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
          <h2 className="text-xl font-semibold">
            {nama && nama.trim() !== ""
              ? `Selamat datang kembali, ${nama}! 👋`
              : "Selamat datang di Dashboard Admin 👋"}
          </h2>
          <p className="mt-1 text-sm text-white/90">
            Semoga harimu menyenangkan dan penuh semangat dalam mengelola data sekolah.
          </p>
        </div>

        {/* 🧩 Komponen statistik */}
        <EcommerceMetrics />
      </div>
    </>
  );
}
