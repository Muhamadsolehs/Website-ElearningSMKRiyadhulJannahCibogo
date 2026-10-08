import { useEffect, useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import PageMeta from "../../../components/common/PageMeta";
import BasicTableOne, { Column } from "../../../components/tables/BasicTables/BasicTableOne";
import { supabase } from "../../../lib/supabaseclient";
import Badge from "../../../components/ui/badge/Badge";
import Button from "../../../components/ui/button/Button";
import bcrypt from "bcryptjs";


type Pengajar = {
  id_pengajar: number;
  nama: string;
  nip: string;
  no_tlp: string;
  alamat: string;
  username: string;
  password: string;
};

export default function KelolaPengajar() {
  const [data, setData] = useState<Pengajar[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState<Partial<Pengajar>>({});

  useEffect(() => {
    async function fetchPengajar() {
      const { data: pengajar, error } = await supabase
        .from("pengajar")
        .select("id_pengajar, nama, nip, no_tlp, alamat, username, password");
      if (error) {
        console.error(error);
        return;
      }
      setData(pengajar ?? []);
    }
    fetchPengajar();
  }, []);

  const handleDelete = async (id_pengajar: number) => {
    // ✅ Tampilkan konfirmasi sebelum hapus
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.");

    // Jika user memilih Cancel, hentikan proses
    if (!confirmDelete) {
      alert("Penghapusan dibatalkan.");
      return;
    }

    // ✅ Jika user menekan OK, tampilkan peringatan akhir (opsional)
    alert("Data akan dihapus secara permanen!");

    // ✅ Hapus data dari Supabase
    const { error } = await supabase
      .from("pengajar")
      .delete()
      .eq("id_pengajar", id_pengajar);

    if (error) {
      console.error("Error deleting data:", error);
      alert(`Gagal menghapus data: ${error.message}`);
      return;
    }

    // ✅ Update state agar data dihapus dari tampilan
    setData((prev) => prev.filter((item) => item.id_pengajar !== id_pengajar));

    // ✅ Notifikasi sukses
    alert("Data berhasil dihapus!");
  };


  const handleAdd = () => {
    setFormMode("add");
    setFormData({});
    setShowForm(true);
  };

  const handleEdit = (row: Pengajar) => {
    setFormMode("edit");
    setFormData({
      ...row,
      password: "", // password tidak ditampilkan kembali saat edit
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hashedPassword = formData.password;

    // ✅ Enkripsi password hanya jika field password tidak kosong
    if (formData.password && formData.password.trim() !== "") {
      const salt = bcrypt.genSaltSync(10);
      hashedPassword = bcrypt.hashSync(formData.password, salt);
    }

    if (formMode === "add") {
      const { data: newData, error } = await supabase
        .from("pengajar")
        .insert([{
          nama: formData.nama,
          nip: formData.nip,
          no_tlp: formData.no_tlp,
          alamat: formData.alamat,
          username: formData.username,
          password: hashedPassword,
        }])
        .select();
      if (error) {
        alert("Gagal menambah data!");
        return;
      }
      setData((prev) => [...prev, ...(newData ?? [])]);
    } else if (formMode === "edit" && formData.id_pengajar) {
      const updateData: Partial<Pengajar> = {
        nama: formData.nama!,
        nip: formData.nip!,
        no_tlp: formData.no_tlp!,
        alamat: formData.alamat!,
        username: formData.username!,
      };

      // ✅ Update password hanya jika user mengisinya
      if (formData.password && formData.password.trim() !== "") {
        updateData.password = hashedPassword as string;
      }

      const { data: updatedData, error } = await supabase
        .from("pengajar")
        .update(updateData)
        .eq("id_pengajar", formData.id_pengajar)
        .select();
      if (error) {
        alert("Gagal mengupdate data!");
        return;
      }
      setData((prev) =>
        prev.map((item) =>
          item.id_pengajar === formData.id_pengajar ? updatedData?.[0] ?? item : item
        )
      );
    }
    setShowForm(false);
  };

  // ✅ Tampilkan password dalam bentuk bintang
  const maskPassword = (password: string) => {
    return password ? "********" : "";
  };

  const columns: Column[] = [
    {
      Header: "No",
      accessor: "no",
      render: (_value: unknown, _row: Pengajar) =>
        data.findIndex((item) => item === _row) + 1,
    },
    { Header: "Nama", accessor: "nama" },
    { Header: "NIP", accessor: "nip" },
    { Header: "No Tlp", accessor: "no_tlp" },
    { Header: "Alamat", accessor: "alamat" },
    { Header: "Username", accessor: "username" },
    {
      Header: "Password",
      accessor: "password",
      render: (value: string) => maskPassword(value),
    },
    {
      Header: "Aksi",
      accessor: "aksi",
      render: (_value, row) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => handleEdit(row)}>
            <Badge variant="light" color="primary">Edit</Badge>
          </button>

          {/* ✅ PERBAIKAN: Tambahkan console.log di sini */}
          <button
            type="button"
            onClick={() => {
              console.log("Tombol Hapus DIKLIK");
              console.log("Data row yang akan dihapus:", row);
              console.log("ID Pengajar:", row.id_pengajar);
              handleDelete(row.id_pengajar);
            }}
          >
            <Badge variant="light" color="error">Hapus</Badge>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Kelola Pengajar" description="Kelola data pengajar" />
      <PageBreadcrumb pageTitle="Kelola Data Pengajar" />
      <div className="space-y-6 relative">
        <ComponentCard title="Data Pengajar">
          <div className="mb-4 flex justify-end">
            <Button size="sm" variant="primary" onClick={handleAdd}>
              Tambah Data
            </Button>
          </div>
          <BasicTableOne columns={columns} data={data} />
        </ComponentCard>

        {showForm && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {formMode === "add" ? "Tambah Pengajar" : "Edit Pengajar"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3 dark:text-gray-100">
                {["nama", "nip", "no_tlp", "alamat", "username", "password"].map((field) => (
                  <div key={field}>
                    <label className="block mb-1 font-medium">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <input
                      type={field === "password" ? "password" : "text"}
                      className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={(formData as any)[field] ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field]: e.target.value }))
                      }
                      required={field !== "password" || formMode === "add"}
                    />
                  </div>
                ))}

                <div className="flex justify-end mt-4 gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
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
