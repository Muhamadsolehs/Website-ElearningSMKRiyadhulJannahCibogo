// pages/Home.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseclient";
import CardPengajar from "../../layout/cardPengajar";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  const [nama, setNama] = useState<string | null>(null);
  const [punyaKelas, setPunyaKelas] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedNama = localStorage.getItem("nama");
    const username = localStorage.getItem("username");
    setNama(storedNama);

    console.log("🔥 username dari localStorage:", username);

    if (!username) return;

    const loadPengajar = async () => {
      // 1️⃣ Ambil pengajar berdasarkan username
      const { data: pengajar, error: ePengajar } = await supabase
        .from("pengajar")
        .select("id_pengajar")
        .eq("username", username)
        .single();

      console.log("🔥 Data pengajar hasil query:", pengajar);

      if (ePengajar || !pengajar) {
        console.log("❌ Gagal ambil id_pengajar:", ePengajar);
        return;
      }

      // 2️⃣ Simpan id_pengajar ke localStorage
      localStorage.setItem("id_pengajar", pengajar.id_pengajar);
      console.log("💾 id_pengajar disimpan:", pengajar.id_pengajar);

      // 3️⃣ Cek apakah pengajar punya kelas wali
      const { data: kelas, error: eKelas } = await supabase
        .from("kelas")
        .select("id_kelas")
        .eq("id_pengajar", pengajar.id_pengajar);

      console.log("🔥 Data kelas:", kelas);
      console.log("🔥 Error kelas:", eKelas);

      // 4️⃣ Set card agar muncul
      setPunyaKelas(Array.isArray(kelas) && kelas.length > 0);
    };

    loadPengajar();
  }, []);

  return (
    <>
      <PageMeta
        title="Dashboard Pengajar | TailAdmin"
        description="Halaman Dashboard Pengajar untuk sistem administrasi sekolah."
      />

      <div className="p-4 space-y-6 md:p-6">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
          <h2 className="text-xl font-semibold">
            {nama && nama.trim() !== ""
              ? `Selamat datang kembali, ${nama}! 👋`
              : "Selamat datang di Dashboard Pengajar 👋"}
          </h2>
          <p className="mt-1 text-sm text-white/90">
            Semoga harimu menyenangkan dan penuh semangat.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 space-y-6 xl:col-span-12">

            {/* Card Pengajar */}
            <CardPengajar />

            {/* 🎓 Card Kelas Perwalian muncul HANYA jika guru punya kelas wali */}
            {punyaKelas && (
              <div
                onClick={() => navigate("/pengajar/Perwalian")}
                className="cursor-pointer p-5 rounded-xl bg-green-50 hover:bg-green-100 
                          border border-green-300 shadow transition"
              >
                <h3 className="text-lg font-semibold text-green-800">
                  Kelas Perwalian
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Lihat data siswa di kelas yang Anda wali-kan.
                </p>

                <div className="mt-4 text-green-700 font-medium">
                  Masuk Kelas →
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
