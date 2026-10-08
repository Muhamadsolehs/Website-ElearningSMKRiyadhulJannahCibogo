import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseclient";
import { Link } from "react-router-dom";

import {
  GroupIcon,
  CalenderIcon,
  BukaBuku,
  Siswa,
  Kelas,
  Jurusan
} from "../icons";

export default function EcommerceMetrics() {
  const [counts, setCounts] = useState({
    siswa: 0,
    pengajar: 0,
    jurusan: 0,
    kelas: 0,
    mapel: 0,
    tahun: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [siswa, pengajar, jurusan, kelas, mapel, tahun] = await Promise.all([
          supabase.from("siswa").select("*", { count: "exact", head: true }),
          supabase.from("pengajar").select("*", { count: "exact", head: true }),
          supabase.from("jurusan").select("*", { count: "exact", head: true }),
          supabase.from("kelas").select("*", { count: "exact", head: true }),
          supabase.from("mata_pelajaran").select("*", { count: "exact", head: true }),
          supabase.from("tahun_ajaran").select("*", { count: "exact", head: true }),
        ]);

        setCounts({
          siswa: siswa.count ?? 0,
          pengajar: pengajar.count ?? 0,
          jurusan: jurusan.count ?? 0,
          kelas: kelas.count ?? 0,
          mapel: mapel.count ?? 0,
          tahun: tahun.count ?? 0,
        });
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      }
    };

    fetchCounts();
  }, []);

  const metrics = [
    {
      title: "Siswa",
      value: counts.siswa.toLocaleString(),
      icon: <Siswa className="text-blue-600 size-6 dark:text-blue-400" />,
      link: "/kelolaSiswa",
      gradient: "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20",
      iconBg: "bg-blue-100 dark:bg-blue-900/40"
    },
    {
      title: "Pengajar",
      value: counts.pengajar.toLocaleString(),
      icon: <GroupIcon className="text-purple-600 size-6 dark:text-purple-400" />,
      link: "/kelolaPengajar",
      gradient: "from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20",
      iconBg: "bg-purple-100 dark:bg-purple-900/40"
    },
    {
      title: "Jurusan",
      value: counts.jurusan.toLocaleString(),
      icon: <Jurusan className="text-green-600 size-6 dark:text-green-400" />,
      link: "/kelolaJurusan",
      gradient: "from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20",
      iconBg: "bg-green-100 dark:bg-green-900/40"
    },
    {
      title: "Kelas",
      value: counts.kelas.toLocaleString(),
      icon: <Kelas className="text-orange-600 size-6 dark:text-orange-400" />,
      link: "/kelolaKelas",
      gradient: "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20",
      iconBg: "bg-orange-100 dark:bg-orange-900/40"
    },
    {
      title: "Mata Pelajaran",
      value: counts.mapel.toLocaleString(),
      icon: <BukaBuku className="text-red-600 size-6 dark:text-red-400" />,
      link: "/kelolaMapel",
      gradient: "from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20",
      iconBg: "bg-red-100 dark:bg-red-900/40"
    },
    {
      title: "Tahun Ajaran",
      value: counts.tahun.toLocaleString(),
      icon: <CalenderIcon className="text-indigo-600 size-6 dark:text-indigo-400" />,
      link: "/kelolaTahun",
      gradient: "from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/40"
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
      {metrics.map((item, index) => (
        <Link
          key={index}
          to={item.link}
          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

          <div className="relative p-5 md:p-6 flex items-center justify-between gap-4">
            <div className="flex-shrink-0">
              <div className={`flex items-center justify-center w-14 h-14 ${item.iconBg} rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 mb-3 shadow-md`}>
                {item.icon}
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {item.title}
              </p>
            </div>

            <div className="flex flex-col items-end">
              <h4 className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-none mb-2">
                {item.value}
              </h4>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                Lihat
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </Link>
      ))}
    </div>
  );
}