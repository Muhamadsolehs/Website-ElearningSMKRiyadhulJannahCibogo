import { useEffect, useState, type ReactElement } from "react";
import { supabase } from "../lib/supabaseclient";
import { BukaBuku } from "../icons";
import { ChevronDown, Archive, Clock } from "lucide-react";

// --- DEKLARASI TIPE DATA UTAMA ---
type TahunRelasi = {
  id_tahun: number;
  nama_tahun: string;
  status_tahun_ajaran: "aktif" | "nonaktif";
};

type AmpuMapelRaw = {
  id_mapel: number;
  nama_mapel: string;
  tahun_ajaran: TahunRelasi | null;
};

type AmpuMapel = {
  id_mapel: number;
  nama_mapel: string;
  nama_tahun: string;
  id_tahun: number;
  status_tahun_ajaran: "aktif" | "nonaktif";
};

type MetricItem = {
  title: string;
  value: string;
  id_tahun: number;
  status: "aktif" | "nonaktif";
  icon: ReactElement;
  link: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  isCustom?: boolean;
};

// 🌈 ARRAY DEFINISI WARNA BERDASARKAN DASHBOARD ADMIN
const COLOR_SCHEMES = [
  {
    iconColor: "text-blue-600 dark:text-blue-400",
    gradient:
      "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    accentColor: "text-blue-600 dark:text-blue-400",
  },
  {
    iconColor: "text-purple-600 dark:text-purple-400",
    gradient:
      "from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    accentColor: "text-purple-600 dark:text-purple-400",
  },
  {
    iconColor: "text-green-600 dark:text-green-400",
    gradient:
      "from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20",
    iconBg: "bg-green-100 dark:bg-green-900/40",
    accentColor: "text-green-600 dark:text-green-400",
  },
  {
    iconColor: "text-orange-600 dark:text-orange-400",
    gradient:
      "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20",
    iconBg: "bg-orange-100 dark:bg-orange-900/40",
    accentColor: "text-orange-600 dark:text-orange-400",
  },
  {
    iconColor: "text-red-600 dark:text-red-400",
    gradient:
      "from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    accentColor: "text-red-600 dark:text-red-400",
  },
  {
    iconColor: "text-indigo-600 dark:text-indigo-400",
    gradient:
      "from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    accentColor: "text-indigo-600 dark:text-indigo-400",
  },
];

export default function CardPengajar() {
  const [ampuMapel, setAmpuMapel] = useState<AmpuMapel[]>([]);
  const [expandedInactiveYear, setExpandedInactiveYear] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [id_pengajar, setId_pengajar] = useState<number | "undefined" | null>(
    "undefined"
  );
  const [loginIdentifier, setLoginIdentifier] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setId_pengajar("undefined");
      setLoginIdentifier(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        let identifier: string | undefined | null = null;

        const storedUsername = localStorage.getItem("username");

        if (storedUsername) {
          identifier = storedUsername.trim();
          console.log(
            `DEBUG 1: Identifier ditemukan dari key 'username':`,
            identifier
          );
        }

        if (!identifier && user) {
          identifier =
            user.user_metadata?.username ||
            user.user_metadata?.user_name ||
            user.email;
          console.log("DEBUG 2: Identifier dari Supabase Metadata:", identifier);
        }

        const finalIdentifier = (identifier || "").trim() || null;
        setLoginIdentifier(finalIdentifier);

        console.log(
          "DEBUG FINAL: Identifier yang digunakan untuk query:",
          finalIdentifier
        );

        if (!finalIdentifier) {
          setId_pengajar(null);
          setLoading(false);
          return;
        }

        const { data: pengajarProfile } = await supabase
          .from("pengajar")
          .select("id_pengajar")
          .eq("username", finalIdentifier)
          .single();

        console.log("DEBUG 4: Hasil Query Pengajar Profile:", pengajarProfile);

        const id = pengajarProfile?.id_pengajar ?? null;
        setId_pengajar(id);

        if (id) {
          await fetchAmpuMapel(id);
        } else {
          setAmpuMapel([]);
        }
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
        setId_pengajar(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const fetchAmpuMapel = async (id: number) => {
    const { data, error } = await supabase
      .from("mata_pelajaran")
      .select(
        `
        id_mapel, 
        nama_mapel,
        tahun_ajaran:id_tahun (id_tahun, nama_tahun, status_tahun_ajaran)
      `
      )
      .eq("id_pengajar", id);

    if (error) {
      setAmpuMapel([]);
    } else if (data && Array.isArray(data)) {
      const rawData = (data as unknown) as AmpuMapelRaw[];
      const formattedData: AmpuMapel[] = rawData
        .map((item) => ({
          id_mapel: item.id_mapel,
          nama_mapel: item.nama_mapel,
          nama_tahun: item.tahun_ajaran?.nama_tahun || "N/A",
          id_tahun: item.tahun_ajaran?.id_tahun || 0,
          status_tahun_ajaran:
            item.tahun_ajaran?.status_tahun_ajaran || "nonaktif",
        }))
        .sort((a, b) => {
          // Urutkan aktif lebih dulu
          if (a.status_tahun_ajaran !== b.status_tahun_ajaran) {
            return a.status_tahun_ajaran === "aktif" ? -1 : 1;
          }
          return 0;
        });

      setAmpuMapel(formattedData);
    } else {
      setAmpuMapel([]);
    }
  };

  const activeMapel = ampuMapel.filter((m) => m.status_tahun_ajaran === "aktif");
  const inactiveMapel = ampuMapel.filter(
    (m) => m.status_tahun_ajaran === "nonaktif"
  );

  // Kelompokkan inactive mapel berdasarkan tahun ajaran
  const inactiveMapelByYear = inactiveMapel.reduce(
    (acc, mapel) => {
      const year = mapel.id_tahun;
      if (!acc[year]) {
        acc[year] = {
          nama_tahun: mapel.nama_tahun,
          mapels: [],
        };
      }
      acc[year].mapels.push(mapel);
      return acc;
    },
    {} as Record<
      number,
      { nama_tahun: string; mapels: AmpuMapel[] }
    >
  );

  const createMapelCard = (
    mapel: AmpuMapel,
    index: number,
    isInactive: boolean = false
  ): MetricItem => {
    const colorIndex = index % COLOR_SCHEMES.length;
    const colorScheme = COLOR_SCHEMES[colorIndex];

    return {
      title: mapel.nama_mapel,
      value: mapel.nama_tahun,
      id_tahun: mapel.id_tahun,
      status: mapel.status_tahun_ajaran,
      icon: (
        <BukaBuku className={`${colorScheme.iconColor} size-6`} />
      ),
      link: `/Pengajar/Mapel/${mapel.id_mapel}`,
      gradient: colorScheme.gradient,
      iconBg: colorScheme.iconBg,
      iconColor: colorScheme.iconColor,
      isCustom: true,
    };
  };

  const renderMapelCard = (item: MetricItem, index: number) => {
    const colorIndex = index % COLOR_SCHEMES.length;
    const colorScheme = COLOR_SCHEMES[colorIndex];
    const footerGradient =
      index % 2 === 0
        ? "from-blue-500 via-purple-500 to-pink-500"
        : "from-green-500 via-teal-500 to-cyan-500";

    return (
      <a
        key={item.title + index}
        href={item.link}
        className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
      >
        {/* Hover gradient overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        />

        {/* Card content */}
        <div className="relative p-6">
          {/* Icon section */}
          <div className="flex items-start justify-between mb-4">
            <div
              className={`flex items-center justify-center w-14 h-14 ${item.iconBg} rounded-xl shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
            >
              {item.icon}
            </div>

            {/* Kelola button - appears on hover */}
            <span
              className={`opacity-0 group-hover:opacity-100 transition-all duration-300 text-xs font-semibold ${colorScheme.accentColor} flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full shadow-sm`}
            >
              Kelola
              <svg
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </div>

          {/* Title and info */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 min-h-[3.5rem]">
              {item.title}
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tahun Ajaran
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-600">
                •
              </span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {item.value}
              </span>
            </div>
          </div>
        </div>

        {/* Animated bottom border */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${footerGradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
        />
      </a>
    );
  };

  let isPengajarView = typeof id_pengajar === "number";

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        Memuat daftar mata pelajaran...
      </div>
    );
  }

  if (id_pengajar === null) {
    return (
      <div className="p-6 text-center text-gray-700 dark:text-gray-300">
        ❌ **Akses Ditolak.** Akun yang sedang login (
        {loginIdentifier ?? "Tidak Terdeteksi"}) tidak ditemukan di tabel
        `public.pengajar` berdasarkan **kolom `username`**.
        <div className="mt-2 text-sm text-gray-500">
          Pastikan nilai **username** di tabel `public.pengajar` (yaitu
          **1060102005**) sama dengan identitas yang digunakan saat login.
        </div>
      </div>
    );
  }

  if (isPengajarView && ampuMapel.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="italic text-gray-500 dark:text-gray-400">
          Belum ada mata pelajaran yang diampu, silahkan hubungi admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 🟢 MATA PELAJARAN AKTIF */}
      {activeMapel.length > 0 && (
        <div className="pt-8">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Mata Pelajaran Aktif
            </h2>
            <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold px-3 py-1 rounded-full">
              {activeMapel.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {activeMapel.map((mapel, index) =>
              renderMapelCard(createMapelCard(mapel, index, false), index)
            )}
          </div>
        </div>
      )}

      {/* 🔴 MATA PELAJARAN NONAKTIF (ARSIP) */}
      {Object.keys(inactiveMapelByYear).length > 0 && (
        <div className="pt-8">
          <div className="flex items-center gap-2 mb-6">
            <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Arsip Mata Pelajaran
            </h2>
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold px-3 py-1 rounded-full">
              {inactiveMapel.length}
            </span>
          </div>

          <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            {Object.entries(inactiveMapelByYear).map(
              ([yearId, yearData]) => {
                const yearIdNum = parseInt(yearId);
                const isExpanded = expandedInactiveYear === yearIdNum;

                return (
                  <div
                    key={yearId}
                    className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    {/* Year Header */}
                    <button
                      onClick={() =>
                        setExpandedInactiveYear(
                          isExpanded ? null : yearIdNum
                        )
                      }
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <ChevronDown
                          className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""
                            }`}
                        />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {yearData.nama_tahun}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {yearData.mapels.length} mata pelajaran
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full font-medium">
                        Nonaktif
                      </span>
                    </button>

                    {/* Mata Pelajaran List */}
                    {isExpanded && (
                      <div className="px-6 pb-4 bg-gray-50 dark:bg-gray-700/30 space-y-3 pt-8">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {yearData.mapels.map((mapel, idx) =>
                            renderMapelCard(
                              createMapelCard(mapel, idx, true),
                              idx
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeMapel.length === 0 && inactiveMapel.length === 0 && (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Belum ada mata pelajaran yang diampu
          </p>
        </div>
      )}
    </div>
  );
}