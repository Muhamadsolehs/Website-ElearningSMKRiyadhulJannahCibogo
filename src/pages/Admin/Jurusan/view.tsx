import { useEffect, useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import PageMeta from "../../../components/common/PageMeta";
import BasicTableOne, { Column } from "../../../components/tables/BasicTables/BasicTableOne";
import { supabase } from "../../../lib/supabaseclient";
import Badge from "../../../components/ui/badge/Badge";
import Button from "../../../components/ui/button/Button";

type Jurusan = {
  id_jurusan: number;
  nama_jurusan: string;
  deskripsi: string;
};

export default function BasicTables() {
  const [data, setData] = useState<Jurusan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<Jurusan>>({});

  // Fetch data
  useEffect(() => {
    async function fetchJurusan() {
      const { data: jurusan, error } = await supabase
        .from("jurusan")
        .select("id_jurusan, nama_jurusan, deskripsi");
      if (error) {
        console.error(error);
        return;
      }
      setData(jurusan ?? []);
    }
    fetchJurusan();
  }, []);

  // Hapus data dengan konfirmasi
  const handleDelete = async (id_jurusan: number) => {
    // ✅ Tampilkan dialog konfirmasi
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus data jurusan ini? Tindakan ini tidak dapat dibatalkan."
    );

    // Jika user memilih Cancel, hentikan proses
    if (!confirmDelete) {
      alert("Penghapusan dibatalkan.");
      return;
    }

    // ✅ Jika user menekan OK, beri peringatan akhir (opsional)
    alert("Data akan dihapus secara permanen!");

    // ✅ Hapus data dari Supabase
    const { error } = await supabase
      .from("jurusan")
      .delete()
      .eq("id_jurusan", id_jurusan);

    if (error) {
      console.error("Error deleting data:", error);
      alert(`Gagal menghapus data: ${error.message}`);
      return;
    }

    // ✅ Hapus data dari state agar langsung hilang dari tampilan
    setData((prev) => prev.filter((item) => item.id_jurusan !== id_jurusan));

    // ✅ Notifikasi sukses
    alert("Data berhasil dihapus!");
  };

  // Tampilkan form tambah
  const handleAdd = () => {
    setFormMode("add");
    setFormData({});
    setShowForm(true);
  };

  // Tampilkan form edit
  const handleEdit = (row: Jurusan) => {
    setFormMode("edit");
    setFormData(row);
    setShowForm(true);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === "add") {
      const { data: newData, error } = await supabase
        .from("jurusan")
        .insert([{ nama_jurusan: formData.nama_jurusan, deskripsi: formData.deskripsi }])
        .select();
      if (error) {
        alert("Gagal menambah data!");
        return;
      }
      setData((prev) => [...prev, ...(newData ?? [])]);
    } else if (formMode === "edit" && formData.id_jurusan) {
      const { data: updatedData, error } = await supabase
        .from("jurusan")
        .update({
          nama_jurusan: formData.nama_jurusan,
          deskripsi: formData.deskripsi,
        })
        .eq("id_jurusan", formData.id_jurusan)
        .select();
      if (error) {
        alert("Gagal mengupdate data!");
        return;
      }
      setData((prev) =>
        prev.map((item) =>
          item.id_jurusan === formData.id_jurusan ? updatedData?.[0] ?? item : item
        )
      );
    }
    setShowForm(false);
  };

  const columns: Column[] = [
    {
      Header: "No",
      accessor: "no",
      render: (_value: unknown, _row: Jurusan) => data.findIndex((item) => item === _row) + 1,
    },


    { Header: "Nama Jurusan", accessor: "nama_jurusan" },
    { Header: "Deskripsi", accessor: "deskripsi" },
    {
      Header: "Aksi",
      accessor: "aksi",
      render: (_value, row) => (
        <div className="flex gap-2">
          <button type="button" className="focus:outline-none" onClick={() => handleEdit(row)}>
            <Badge variant="light" color="primary">Edit</Badge>
          </button>
          <button
            type="button"
            className="focus:outline-none"
            onClick={() => handleDelete(row.id_jurusan)}
          >
            <Badge variant="light" color="error">Hapus</Badge>
          </button>
        </div>
      ),
    },
  ];


  return (
    <>
      <PageMeta title="Kelola Jurusan" description="Kelola data jurusan" />
      <PageBreadcrumb pageTitle="Kelola data jurusan" />
      <div className="space-y-6 relative">
        <ComponentCard title="Data Jurusan">
          <div className="mb-4 flex justify-end">
            <Button size="sm" variant="primary" onClick={handleAdd}>
              Tambah Data
            </Button>
          </div>
          <BasicTableOne columns={columns} data={data} />
        </ComponentCard>

        {/* Popup melayang */}
        {showForm && (
          <div className="absolute top-0 left-0 right-0 flex justify-center mt-20 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                {formMode === "add" ? "Tambah Jurusan" : "Edit Jurusan"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                    Nama Jurusan
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.nama_jurusan ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nama_jurusan: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                    Deskripsi
                  </label>
                  <textarea
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.deskripsi ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, deskripsi: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm transition"
                  >
                    {formMode === "add" ? "Simpan" : "Update"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
