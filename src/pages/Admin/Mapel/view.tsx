import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import BasicTableOne, { Column } from "../../../components/tables/BasicTables/BasicTableOne";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import { supabase } from "../../../lib/supabaseclient";

// --- DEKLARASI TIPE ---
type KelasRel = { id_kelas: number; nama_kelas: string } | null;
type TahunRel = { id_tahun: number; nama_tahun: string } | null;
type PengajarRel = { id_pengajar: number; nama: string } | null;

type Mapel = {
  id_mapel: number;
  nama_mapel: string;
  id_kelas: number;
  kelas?: KelasRel;
  id_tahun: number;
  tahun_ajaran?: TahunRel; // Menggunakan nama relasi
  id_pengajar: number;
  pengajar?: PengajarRel;
};

export default function KelolaMataPelajaran() {
  const [data, setData] = useState<Mapel[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);

  // --- STATE BARU UNTUK DROPDOWN ---
  const [tahunList, setTahunList] = useState<any[]>([]);
  const [pengajarList, setPengajarList] = useState<any[]>([]);
  // ----------------------------------

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<Mapel>>({});

  useEffect(() => {
    fetchAll();
  }, []);

  /** Ambil semua data master (kelas, tahun, pengajar) dan data utama */
  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchData(), fetchKelas(), fetchTahun(), fetchPengajar()]);
    setLoading(false);
  };

  /** Ambil data mapel + relasi */
  const fetchData = async () => {
    const { data, error } = await supabase
      .from("mata_pelajaran")
      .select(`
      id_mapel,
      nama_mapel,
      id_kelas, id_tahun, id_pengajar,
      kelas:kelas!mata_pelajaran_id_kelas_fkey (id_kelas, nama_kelas),
      tahun_ajaran:tahun_ajaran!mata_pelajaran_id_tahun_fkey (id_tahun, nama_tahun),
      pengajar:pengajar!mata_pelajaran_id_pengajar_fkey (id_pengajar, nama)
    `)
      .order("id_mapel", { ascending: true });

    if (error) {
      console.error("Error fetching mapel:", error);
      alert("Gagal memuat data mata pelajaran!");
    } else {
      // cast via unknown to satisfy TypeScript when runtime types are not strict
      setData((data ?? []) as unknown as Mapel[]);
    }
  };

  /** Ambil daftar kelas untuk dropdown */
  const fetchKelas = async () => {
    const { data, error } = await supabase.from("kelas").select("id_kelas, nama_kelas");
    if (error) console.error("Error fetching kelas:", error);
    else setKelasList(data ?? []);
  };

  /** Ambil daftar tahun untuk dropdown */
  const fetchTahun = async () => {
    const { data, error } = await supabase.from("tahun_ajaran").select("id_tahun, nama_tahun");
    if (error) console.error("Error fetching tahun_ajaran:", error);
    else setTahunList(data ?? []);
  };

  /** Ambil daftar pengajar untuk dropdown */
  const fetchPengajar = async () => {
    const { data, error } = await supabase.from("pengajar").select("id_pengajar, nama");
    if (error) console.error("Error fetching pengajar:", error);
    else setPengajarList(data ?? []);
  };

  /** Tambah data */
  const handleAdd = () => {
    setFormMode("add");
    setFormData({});
    setShowForm(true);
  };

  /** Edit data */
  const handleEdit = (row: Mapel) => {
    setFormMode("edit");
    setFormData({
      id_mapel: row.id_mapel,
      nama_mapel: row.nama_mapel,
      id_kelas: row.id_kelas,
      id_tahun: row.id_tahun,       // <-- DITAMBAH
      id_pengajar: row.id_pengajar, // <-- DITAMBAH
    });
    setShowForm(true);
  };

  /** Hapus data */
  const handleDelete = async (id_mapel: number) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    setLoading(true);
    const { error } = await supabase.from("mata_pelajaran").delete().eq("id_mapel", id_mapel);
    if (error) alert("Gagal menghapus data mapel!");
    await fetchData();
    setLoading(false);
  };

  /** Simpan form */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      nama_mapel: formData.nama_mapel,
      id_kelas: formData.id_kelas,
      id_tahun: formData.id_tahun,       // <-- DITAMBAH
      id_pengajar: formData.id_pengajar, // <-- DITAMBAH
    };

    try {
      if (formMode === "add") {
        const { error } = await supabase.from("mata_pelajaran").insert([payload]);
        if (error) throw error;
      } else if (formMode === "edit" && formData.id_mapel) {
        const { error } = await supabase
          .from("mata_pelajaran")
          .update(payload)
          .eq("id_mapel", formData.id_mapel);
        if (error) throw error;
      }
      await fetchData();
      setShowForm(false);
      setFormData({});
    } catch (error) {
      console.error("submit error:", error);
      alert("Gagal menyimpan data!");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column[] = [
    { Header: "No", accessor: "no", render: (_v, row) => data.findIndex((r) => r === row) + 1 },
    { Header: "Nama Mapel", accessor: "nama_mapel" },
    {
      Header: "Kelas",
      accessor: "kelas",
      render: (_v, row) => row.kelas?.nama_kelas ?? "-",
    },
    {
      Header: "Tahun Ajaran",
      accessor: "tahun_ajaran", // <-- MENGGUNAKAN NAMA RELASI
      render: (_v, row) => row.tahun_ajaran?.nama_tahun ?? "-", // <-- MENGGUNAKAN row.tahun_ajaran
    },
    {
      Header: "Pengajar",
      accessor: "pengajar",
      render: (_v, row) => row.pengajar?.nama ?? "-",
    },
    {
      Header: "Aksi",
      accessor: "aksi",
      render: (_v, row) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} disabled={loading}>
            <Badge variant="light" color="primary">Edit</Badge>
          </button>
          <button onClick={() => handleDelete(row.id_mapel)} disabled={loading}>
            <Badge variant="light" color="error">Hapus</Badge>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Kelola Mata Pelajaran" description="Kelola data mata pelajaran" />
      <PageBreadcrumb pageTitle="Kelola Data Mata Pelajaran" />

      <div className="space-y-6 relative">
        <ComponentCard title="Data Mata Pelajaran">
          <div className="mb-4 flex justify-end">
            <Button size="sm" variant="primary" onClick={handleAdd} disabled={loading}>
              Tambah Data
            </Button>
          </div>

          {loading ? (
            <div className="p-4 text-center">Memuat data...</div>
          ) : (
            <BasicTableOne columns={columns} data={data} />
          )}
        </ComponentCard>

        {/* Form Tambah/Edit */}
        {showForm && (
          <div className="absolute top-0 left-0 right-0 flex justify-center mt-20 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
              <h2 className="text-lg font-semibold mb-4">
                {formMode === "add" ? "Tambah Mata Pelajaran" : "Edit Mata Pelajaran"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block mb-1">Nama Mapel</label>
                  <input
                    value={formData.nama_mapel ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, nama_mapel: e.target.value }))}
                    required
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block mb-1">Kelas</label>
                  <select
                    value={formData.id_kelas?.toString() ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, id_kelas: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    required
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={submitting}
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {kelasList.map((k) => (
                      <option key={k.id_kelas} value={k.id_kelas.toString()}>
                        {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Tahun Ajaran</label>
                  <select
                    value={formData.id_tahun?.toString() ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, id_tahun: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    required
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={submitting}
                  >
                    <option value="">-- Pilih Tahun --</option>
                    {tahunList.map((t) => ( // MENGGUNAKAN tahunList
                      <option key={t.id_tahun} value={t.id_tahun.toString()}>
                        {t.nama_tahun}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Pengajar</label>
                  <select
                    value={formData.id_pengajar?.toString() ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, id_pengajar: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    required
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={submitting}
                  >
                    <option value="">-- Pilih Pengajar --</option>
                    {pengajarList.map((p) => ( // MENGGUNAKAN pengajarList
                      <option key={p.id_pengajar} value={p.id_pengajar.toString()}>
                        {p.nama}
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
                    {submitting ? "Menyimpan..." : formMode === "add" ? "Simpan" : "Update"}
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
      </div>
    </>
  );
}