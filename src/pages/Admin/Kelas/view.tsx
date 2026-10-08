import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import BasicTableOne, { Column } from "../../../components/tables/BasicTables/BasicTableOne";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import { supabase } from "../../../lib/supabaseclient";
import { ChevronDown, Archive, Clock } from "lucide-react";

// --- Definisi Tipe Data ---
type PengajarRel = { id_pengajar: number; nama: string } | null;
type JurusanRel = { id_jurusan: number; nama_jurusan: string } | null;
type TahunRel = {
  id_tahun: number;
  nama_tahun: string;
  status_tahun_ajaran: "aktif" | "nonaktif";
} | null;

// Tipe untuk Siswa yang akan ditampilkan di modal
type Siswa = { id_siswa: number; nama: string; nis: string; username: string };

type Kelas = {
  id_kelas: number;
  nama_kelas: string;
  id_jurusan?: number | null;
  id_pengajar?: number | null;
  id_tahun?: number | null;
  pengajar?: PengajarRel;
  jurusan?: JurusanRel;
  tahun_ajaran?: TahunRel;
  siswa_count?: number;
};

// --- Komponen Modal Daftar Siswa ---
const SiswaListModal = ({
  kelasName,
  idKelas,
  onClose,
}: {
  kelasName: string;
  idKelas: number;
  onClose: () => void;
}) => {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [modalLoading, setModalLoading] = useState(true);

  useEffect(() => {
    const fetchSiswa = async () => {
      setModalLoading(true);
      const { data, error } = await supabase
        .from("siswa")
        .select(`id_siswa, nama, nis, username`)
        .eq("id_kelas", idKelas)
        .order("nis", { ascending: true });

      if (error) {
        console.error("Error fetching siswa:", error);
        alert("Gagal memload data siswa!");
      } else {
        setSiswaList(data as Siswa[]);
      }
      setModalLoading(false);
    };
    fetchSiswa();
  }, [idKelas]);

  return (
    <div className="absolute top-0 left-0 right-0 flex justify-center mt-20 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
        <h2 className="text-xl font-bold mb-4 block mb-1">
          Daftar Siswa Kelas {kelasName}
        </h2>

        {modalLoading ? (
          <div className="p-4 text-center dark:border-gray-700 text-gray-900 dark:text-gray-100">
            Memuat daftar siswa...
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {siswaList.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Tidak ada siswa yang terdaftar di kelas ini.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      NIS
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Username
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {siswaList.map((siswa, index) => (
                    <tr key={siswa.id_siswa}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {siswa.nama}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {siswa.nis}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {siswa.username}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Komponen Utama Kelola Kelas ---
export default function KelolaKelas() {
  const [data, setData] = useState<Kelas[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<Kelas>>({});
  const [jurusanList, setJurusanList] = useState<any[]>([]);
  const [pengajarList, setPengajarList] = useState<any[]>([]);
  const [tahunList, setTahunList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedInactiveYear, setExpandedInactiveYear] = useState<
    number | null
  >(null);

  // State untuk modal siswa
  const [siswaModalData, setSiswaModalData] = useState<{
    id_kelas: number;
    nama_kelas: string;
  } | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    await Promise.all([fetchData(), fetchSelectOptions()]);
  }

  /** Ambil data kelas + relasi + jumlah siswa */
  const fetchData = async () => {
    setLoading(true);

    const { data: kelasData, error } = await supabase
      .from("kelas")
      .select(`
        id_kelas,
        nama_kelas,
        id_jurusan,
        id_pengajar,
        id_tahun,
        jurusan:jurusan!kelas_id_jurusan_fkey (
          id_jurusan, 
          nama_jurusan
        ),
        pengajar:pengajar!kelas_id_pengajar_fkey (
          id_pengajar, 
          nama
        ),
        tahun_ajaran:id_tahun (
          id_tahun, 
          nama_tahun,
          status_tahun_ajaran
        ),
        siswa(count)
      `);

    if (error) {
      console.error("❌ Error fetching data:", error);
      alert(`Gagal memuat data kelas. Detail: ${error.message}`);
      setLoading(false);
      return;
    }

    const mapped: Kelas[] = (kelasData ?? []).map((item: any) => ({
      id_kelas: item.id_kelas,
      nama_kelas: item.nama_kelas,
      id_jurusan: item.id_jurusan,
      id_pengajar: item.id_pengajar,
      id_tahun: item.id_tahun,
      pengajar: item.pengajar
        ? { id_pengajar: item.pengajar.id_pengajar, nama: item.pengajar.nama }
        : null,
      jurusan: item.jurusan
        ? {
          id_jurusan: item.jurusan.id_jurusan,
          nama_jurusan: item.jurusan.nama_jurusan,
        }
        : null,
      tahun_ajaran: item.tahun_ajaran
        ? {
          id_tahun: item.tahun_ajaran.id_tahun,
          nama_tahun: item.tahun_ajaran.nama_tahun,
          status_tahun_ajaran: item.tahun_ajaran.status_tahun_ajaran,
        }
        : null,
      siswa_count: item.siswa[0]?.count ?? 0,
    }));

    setData(mapped);
    setLoading(false);
  };

  /** Ambil opsi dropdown */
  const fetchSelectOptions = async () => {
    const [jurusanRes, pengajarRes, tahunRes] = await Promise.all([
      supabase.from("jurusan").select("id_jurusan, nama_jurusan"),
      supabase.from("pengajar").select("id_pengajar, nama"),
      supabase
        .from("tahun_ajaran")
        .select("id_tahun, nama_tahun, status_tahun_ajaran"),
    ]);

    if (jurusanRes.error) console.error("jurusan fetch error:", jurusanRes.error);
    if (pengajarRes.error) console.error("pengajar fetch error:", pengajarRes.error);
    if (tahunRes.error) console.error("tahun fetch error:", tahunRes.error);

    setJurusanList(jurusanRes.data ?? []);
    setPengajarList(pengajarRes.data ?? []);
    setTahunList(tahunRes.data ?? []);
  };

  /** Hapus kelas */
  const handleDelete = async (id_kelas: number) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    setLoading(true);
    const { error } = await supabase
      .from("kelas")
      .delete()
      .eq("id_kelas", id_kelas);
    if (error) {
      console.error("delete error:", error);
      alert("Gagal menghapus data!");
      setLoading(false);
      return;
    }
    await fetchData();
  };

  /** Tambah kelas */
  const handleAdd = () => {
    setFormMode("add");
    setFormData({});
    setShowForm(true);
  };

  /** Edit kelas */
  const handleEdit = (row: Kelas) => {
    setFormMode("edit");
    setFormData({
      id_kelas: row.id_kelas,
      nama_kelas: row.nama_kelas,
      id_jurusan: row.id_jurusan ?? null,
      id_pengajar: row.id_pengajar ?? null,
      id_tahun: row.id_tahun ?? null,
    });
    setShowForm(true);
  };

  /** Buka Modal Siswa */
  const handleViewSiswa = (row: Kelas) => {
    if (row.id_kelas && row.nama_kelas) {
      setSiswaModalData({ id_kelas: row.id_kelas, nama_kelas: row.nama_kelas });
    }
  };

  /** Submit form (tambah/edit) */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      nama_kelas: formData.nama_kelas,
      id_jurusan: formData.id_jurusan,
      id_pengajar: formData.id_pengajar,
      id_tahun: formData.id_tahun,
    };

    try {
      if (formMode === "add") {
        const { error } = await supabase.from("kelas").insert([payload]);
        if (error) throw error;
      } else if (formMode === "edit" && formData.id_kelas) {
        const { error } = await supabase
          .from("kelas")
          .update(payload)
          .eq("id_kelas", formData.id_kelas);
        if (error) throw error;
      }
      await fetchData();
      setShowForm(false);
      setFormData({});
    } catch (error) {
      console.error("submit error:", error);
      alert(
        "Gagal menyimpan data! Mungkin ada konflik data (misal: Wali kelas sudah terdaftar)."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Pisahkan kelas aktif dan nonaktif
  const activeClasses = data.filter(
    (k) => k.tahun_ajaran?.status_tahun_ajaran === "aktif"
  );
  const inactiveClasses = data.filter(
    (k) => k.tahun_ajaran?.status_tahun_ajaran === "nonaktif"
  );

  // Kelompokkan inactive classes berdasarkan tahun ajaran
  const inactiveClassesByYear = inactiveClasses.reduce(
    (acc, kelas) => {
      const year = kelas.id_tahun || 0;
      if (!acc[year]) {
        acc[year] = {
          nama_tahun: kelas.tahun_ajaran?.nama_tahun || "N/A",
          kelases: [],
        };
      }
      acc[year].kelases.push(kelas);
      return acc;
    },
    {} as Record<number, { nama_tahun: string; kelases: Kelas[] }>
  );

  /** Kolom tabel */
  const columns: Column[] = [
    {
      Header: "No",
      accessor: "no",
      render: (_v, row) => data.findIndex((r) => r === row) + 1,
    },
    { Header: "Nama Kelas", accessor: "nama_kelas" },
    {
      Header: "Jurusan",
      accessor: "jurusan",
      render: (_v, row) => row.jurusan?.nama_jurusan ?? "-",
    },
    {
      Header: "Wali Kelas",
      accessor: "pengajar",
      render: (_v, row) => row.pengajar?.nama ?? "-",
    },
    {
      Header: "Tahun Ajaran",
      accessor: "tahun_ajaran",
      render: (_v, row) => row.tahun_ajaran?.nama_tahun ?? "-",
    },
    {
      Header: "Aksi",
      accessor: "aksi",
      render: (_v, row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleViewSiswa(row)}
            disabled={loading || row.siswa_count === 0}
            title={`Lihat ${row.siswa_count ?? 0} Siswa`}
          >
            <Badge variant="light" color="info">
              Siswa ({row.siswa_count ?? 0})
            </Badge>
          </button>
          <button type="button" onClick={() => handleEdit(row)} disabled={loading}>
            <Badge variant="light" color="primary">
              Edit
            </Badge>
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.id_kelas)}
            disabled={loading}
          >
            <Badge variant="light" color="error">
              Hapus
            </Badge>
          </button>
        </div>
      ),
    },
  ];

  const renderTable = (tableData: Kelas[]) => (
    <BasicTableOne columns={columns} data={tableData} />
  );

  // Bagian Render
  return (
    <>
      <PageMeta title="Kelola Kelas" description="Kelola data kelas" />
      <PageBreadcrumb pageTitle="Kelola Data Kelas" />

      <div className="space-y-6 relative">
        {/* 🟢 KELAS AKTIF */}
        {activeClasses.length > 0 && (
          <ComponentCard title="">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Kelas Aktif
              </h3>
              <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold px-3 py-1 rounded-full">
                {activeClasses.length}
              </span>
            </div>

            <div className="mb-4 flex justify-end">
              <Button
                size="sm"
                variant="primary"
                onClick={handleAdd}
                disabled={loading}
              >
                Tambah Data
              </Button>
            </div>

            {loading ? (
              <div className="p-4 text-center block mb-1">Memuat data...</div>
            ) : (
              renderTable(activeClasses)
            )}
          </ComponentCard>
        )}

        {/* 🔴 KELAS NONAKTIF (ARSIP) */}
        {Object.keys(inactiveClassesByYear).length > 0 && (
          <ComponentCard title="">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Arsip Kelas
              </h3>
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold px-3 py-1 rounded-full">
                {inactiveClasses.length}
              </span>
            </div>

            <div className="space-y-4">
              {Object.entries(inactiveClassesByYear).map(([yearId, yearData]) => {
                const yearIdNum = parseInt(yearId);
                const isExpanded = expandedInactiveYear === yearIdNum;

                return (
                  <div key={yearId}>
                    {/* Year Header */}
                    <button
                      onClick={() =>
                        setExpandedInactiveYear(isExpanded ? null : yearIdNum)
                      }
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg border border-gray-200 dark:border-gray-700"
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
                            {yearData.kelases.length} kelas
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full font-medium">
                        Nonaktif
                      </span>
                    </button>

                    {/* Kelas List */}
                    {isExpanded && (
                      <div className="mt-3 ml-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                        {renderTable(yearData.kelases)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ComponentCard>
        )}

        {/* Empty State */}
        {activeClasses.length === 0 && inactiveClasses.length === 0 && (
          <ComponentCard title="Data Kelas">
            <div className="mb-4 flex justify-end">
              <Button
                size="sm"
                variant="primary"
                onClick={handleAdd}
                disabled={loading}
              >
                Tambah Data
              </Button>
            </div>
            <div className="p-8 text-center text-gray-500">
              Tidak ada data kelas
            </div>
          </ComponentCard>
        )}

        {/* --- Form Tambah/Edit Kelas --- */}
        {showForm && (
          <div className="absolute top-0 left-0 right-0 flex justify-center mt-20 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
              <h2 className="text-lg font-semibold mb-4">
                {formMode === "add" ? "Tambah Kelas" : "Edit Kelas"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block mb-1">Nama Kelas</label>
                  <input
                    value={formData.nama_kelas ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, nama_kelas: e.target.value }))
                    }
                    required
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block mb-1">Jurusan</label>
                  <select
                    value={formData.id_jurusan?.toString() ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        id_jurusan: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    required
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={submitting}
                  >
                    <option value="">-- Pilih Jurusan --</option>
                    {jurusanList.map((j) => (
                      <option key={j.id_jurusan} value={j.id_jurusan.toString()}>
                        {j.nama_jurusan}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Wali Kelas</label>
                  <select
                    value={formData.id_pengajar?.toString() ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        id_pengajar: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    required
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={submitting}
                  >
                    <option value="">-- Pilih Pengajar --</option>
                    {pengajarList.map((p) => (
                      <option key={p.id_pengajar} value={p.id_pengajar.toString()}>
                        {p.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Tahun Ajaran</label>
                  <select
                    value={formData.id_tahun?.toString() ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        id_tahun: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    required
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={submitting}
                  >
                    <option value="">-- Pilih Tahun Ajaran --</option>
                    {tahunList.map((t) => (
                      <option key={t.id_tahun} value={t.id_tahun.toString()}>
                        {t.nama_tahun}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Menyimpan..."
                      : formMode === "add"
                        ? "Simpan"
                        : "Update"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded border"
                    disabled={submitting}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DAFTAR SISWA */}
        {siswaModalData && (
          <SiswaListModal
            idKelas={siswaModalData.id_kelas}
            kelasName={siswaModalData.nama_kelas}
            onClose={() => setSiswaModalData(null)}
          />
        )}
      </div>
    </>
  );
}