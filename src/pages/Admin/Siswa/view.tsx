import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import BasicTableOne, { Column } from "../../../components/tables/BasicTables/BasicTableOne";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import { supabase } from "../../../lib/supabaseclient";

// --- Definisi Tipe Data Siswa ---
type KelasRel = { id_kelas: number; nama_kelas: string } | null;

type Siswa = {
  id_siswa: number;
  nama: string;
  nis: string;
  username: string;
  password?: string;
  id_kelas: number | null;
  kelas: KelasRel;
};

// --- Komponen Utama ---
export default function KelolaSiswa() {
  const [data, setData] = useState<Siswa[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<Siswa>>({});
  const [classList, setClassList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [filterKelasId, setFilterKelasId] = useState<number | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filterKelasId]);

  async function fetchAll() {
    await fetchSelectOptions();
  }

  /** Ambil data siswa + relasi Kelas (TANPA PASSWORD) */
  const fetchData = async () => {
    setLoading(true);

    let query = supabase
      .from("siswa")
      .select(`
        id_siswa,
        nama,
        nis,
        username,
        id_kelas,
        kelas (id_kelas, nama_kelas)
      `);

    if (filterKelasId) {
      query = query.eq("id_kelas", filterKelasId);
    }

    const { data: siswaData, error } = await query;


    if (error) {
      console.error("❌ Error fetching data siswa:", error);
      alert("Gagal memuat data siswa.");
      setLoading(false);
      return;
    }

    const mapped: Siswa[] = (siswaData ?? []).map((item: any) => ({
      id_siswa: item.id_siswa,
      nama: item.nama,
      nis: item.nis,
      username: item.username,
      id_kelas: item.id_kelas,
      kelas: item.kelas
        ? { id_kelas: item.kelas.id_kelas, nama_kelas: item.kelas.nama_kelas }
        : null,
    }));

    setData(mapped);
    setLoading(false);
  };

  /** Ambil opsi dropdown Kelas (TIDAK BERUBAH) */
  const fetchSelectOptions = async () => {
    const { data, error } = await supabase.from("kelas").select("id_kelas, nama_kelas").order("nama_kelas");
    if (error) console.error("kelas fetch error:", error);
    setClassList(data ?? []);
  };

  /** Hapus siswa (TIDAK BERUBAH) */
  const handleDelete = async (id_siswa: number) => {
    if (!confirm("Yakin ingin menghapus data siswa ini?")) return;
    setLoading(true);
    const { error } = await supabase.from("siswa").delete().eq("id_siswa", id_siswa);
    if (error) {
      console.error("delete error:", error);
      alert("Gagal menghapus data siswa!");
      setLoading(false);
      return;
    }
    await fetchData();
  };

  /** Tambah siswa (TIDAK BERUBAH) */
  const handleAdd = () => {
    setFormMode("add");
    setFormData({});
    setShowForm(true);
  };

  /** Edit siswa (TIDAK BERUBAH) */
  const handleEdit = (row: Siswa) => {
    setFormMode("edit");
    setFormData({
      id_siswa: row.id_siswa,
      nama: row.nama,
      nis: row.nis,
      username: row.username,
      password: "",
      id_kelas: row.id_kelas,
    });
    setShowForm(true);
  };

  /** Submit form (TIDAK BERUBAH) */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: Partial<Siswa> = {
      nama: formData.nama,
      nis: formData.nis,
      username: formData.username,
      id_kelas: formData.id_kelas,
    };

    if (formMode === 'add' || formData.password) {
      payload.password = formData.password;
    }

    try {
      if (formMode === "add") {
        const { error } = await supabase.from("siswa").insert([payload]);
        if (error) throw error;
      } else if (formMode === "edit" && formData.id_siswa) {
        const { error } = await supabase.from("siswa").update(payload).eq("id_siswa", formData.id_siswa);
        if (error) throw error;
      }
      await fetchData();
      setShowForm(false);
      setFormData({});
    } catch (error) {
      console.error("submit error:", error);
      alert("Gagal menyimpan data siswa!");
    } finally {
      setSubmitting(false);
    }
  };

  /** Kolom tabel (TIDAK BERUBAH) */
  const columns: Column[] = [
    { Header: "No", accessor: "no", render: (_v, row) => data.findIndex((r) => r === row) + 1 },
    { Header: "Nama", accessor: "nama" },
    { Header: "NIS", accessor: "nis" },
    { Header: "Username", accessor: "username" },
    { Header: "Kelas", accessor: "kelas", render: (_v, row) => row.kelas?.nama_kelas ?? "-" },
    {
      Header: "Aksi",
      accessor: "aksi",
      render: (_v, row) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => handleEdit(row)} disabled={loading}>
            <Badge variant="light" color="primary">Edit</Badge>
          </button>
          <button type="button" onClick={() => handleDelete(row.id_siswa)} disabled={loading}>
            <Badge variant="light" color="error">Hapus</Badge>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Kelola Siswa" description="Kelola data siswa" />
      <PageBreadcrumb pageTitle="Kelola Data Siswa" />

      <div className="space-y-6 relative">
        <ComponentCard title="Data Siswa">

          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            {/* Filter Kelas */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap dark:text-gray-300">Filter Kelas:</label>
              <select
                value={filterKelasId ?? ""}
                onChange={(e) =>
                  setFilterKelasId(e.target.value ? Number(e.target.value) : null)
                }
                disabled={loading || submitting}
                // Class Dark Mode untuk Select
                className="border rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Semua Kelas</option>
                {classList.map((k) => (
                  <option key={k.id_kelas} value={k.id_kelas.toString()}>
                    {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Tambah */}
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

        {/* --- Form Tambah/Edit Siswa (DIPERBAIKI UNTUK DARK MODE) --- */}
        {showForm && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{formMode === "add" ? "Tambah Siswa" : "Edit Siswa"}</h2>
              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Input Nama */}
                <div>
                  <label className="block mb-1 dark:text-gray-300">Nama Siswa</label>
                  <input
                    value={formData.nama ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, nama: e.target.value }))}
                    required
                    // Class Dark Mode untuk Input
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={submitting}
                  />
                </div>

                {/* Input NIS */}
                <div>
                  <label className="block mb-1 dark:text-gray-300">NIS</label>
                  <input
                    value={formData.nis ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, nis: e.target.value }))}
                    required
                    // Class Dark Mode untuk Input
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={submitting}
                  />
                </div>

                {/* Input Username */}
                <div>
                  <label className="block mb-1 dark:text-gray-300">Username</label>
                  <input
                    value={formData.username ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                    required
                    // Class Dark Mode untuk Input
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={submitting}
                  />
                </div>

                {/* Input Password (dibuat opsional/kosong saat edit) */}
                <div>
                  <label className="block mb-1 dark:text-gray-300">Password {formMode === 'edit' && "(Kosongkan jika tidak diubah)"}</label>
                  <input
                    type="password"
                    value={formData.password ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                    required={formMode === 'add'}
                    // Class Dark Mode untuk Input
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={submitting}
                  />
                </div>

                {/* Dropdown Kelas */}
                <div>
                  <label className="block mb-1 dark:text-gray-300">Kelas</label>
                  <select
                    value={formData.id_kelas?.toString() ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, id_kelas: e.target.value ? Number(e.target.value) : null }))
                    }
                    required
                    // Class Dark Mode untuk Select
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={submitting}
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classList.map((k) => (
                      <option key={k.id_kelas} value={k.id_kelas.toString()}>
                        {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 justify-end">
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white" disabled={submitting}>
                    {submitting ? "Menyimpan..." : (formMode === "add" ? "Simpan" : "Update")}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded border dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700" disabled={submitting}>
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