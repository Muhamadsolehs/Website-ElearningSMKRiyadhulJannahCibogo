import { useEffect, useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import PageMeta from "../../../components/common/PageMeta";
import BasicTableOne, { Column } from "../../../components/tables/BasicTables/BasicTableOne";
import { supabase } from "../../../lib/supabaseclient";
import Badge from "../../../components/ui/badge/Badge";
import Button from "../../../components/ui/button/Button";

type TahunAjaran = {
    id_tahun: number;
    nama_tahun: string;
    semester_ajaran: string;
    status_tahun_ajaran: string;
};

export default function KelolaTahunAjaran() {
    const [data, setData] = useState<TahunAjaran[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState<"add" | "edit">("add");
    const [formData, setFormData] = useState<Partial<TahunAjaran>>({});

    // Fetch data
    useEffect(() => {
        async function fetchTahunAjaran() {
            const { data: tahunAjaran, error } = await supabase
                .from("tahun_ajaran")
                .select("id_tahun, nama_tahun, semester_ajaran, status_tahun_ajaran")
                .order("id_tahun", { ascending: true });

            if (error) {
                console.error("Error fetching data:", error);
                return;
            }
            setData(tahunAjaran ?? []);
        }

        fetchTahunAjaran();
    }, []);

    // Hapus data
    const handleDelete = async (id_tahun: number) => {
        const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus data ini?");
        if (!confirmDelete) return;

        const { error } = await supabase.from("tahun_ajaran").delete().eq("id_tahun", id_tahun);
        if (error) {
            alert("Gagal menghapus data!");
            console.error(error);
            return;
        }
        setData((prev) => prev.filter((item) => item.id_tahun !== id_tahun));
    };

    // Tambah data
    const handleAdd = () => {
        setFormMode("add");
        setFormData({});
        setShowForm(true);
    };

    // Edit data
    const handleEdit = (row: TahunAjaran) => {
        setFormMode("edit");
        setFormData(row);
        setShowForm(true);
    };

    // Simpan data (add/edit)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formMode === "add") {
            const { data: newData, error } = await supabase
                .from("tahun_ajaran")
                .insert([
                    {
                        nama_tahun: formData.nama_tahun,
                        semester_ajaran: formData.semester_ajaran,
                        status_tahun_ajaran: formData.status_tahun_ajaran,
                    },
                ])
                .select();

            if (error) {
                alert("Gagal menambah data!");
                console.error(error);
                return;
            }
            setData((prev) => [...prev, ...(newData ?? [])]);
        } else if (formMode === "edit" && formData.id_tahun) {
            const { data: updatedData, error } = await supabase
                .from("tahun_ajaran")
                .update({
                    nama_tahun: formData.nama_tahun,
                    semester_ajaran: formData.semester_ajaran,
                    status_tahun_ajaran: formData.status_tahun_ajaran,
                })
                .eq("id_tahun", formData.id_tahun)
                .select();

            if (error) {
                alert("Gagal mengupdate data!");
                console.error(error);
                return;
            }
            setData((prev) =>
                prev.map((item) =>
                    item.id_tahun === formData.id_tahun ? updatedData?.[0] ?? item : item
                )
            );
        }

        setShowForm(false);
    };

    // Kolom tabel
    const columns: Column[] = [
        {
            Header: "No",
            accessor: "no",
            render: (_value: unknown, _row: TahunAjaran) =>
                data.findIndex((item) => item === _row) + 1,
        },
        { Header: "Nama Tahun", accessor: "nama_tahun" },
        { Header: "Semester", accessor: "semester_ajaran" },
        {
            Header: "Status",
            accessor: "status_tahun_ajaran",
            render: (value) => (
                <Badge
                    variant="light"
                    color={value === "aktif" ? "success" : "secondary"}
                >
                    {value}
                </Badge>
            ),
        },
        {
            Header: "Aksi",
            accessor: "aksi",
            render: (_value, row) => (
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="focus:outline-none"
                        onClick={() => handleEdit(row)}
                    >
                        <Badge variant="light" color="primary">
                            Edit
                        </Badge>
                    </button>
                    <button
                        type="button"
                        className="focus:outline-none"
                        onClick={() => handleDelete(row.id_tahun)}
                    >
                        <Badge variant="light" color="error">
                            Hapus
                        </Badge>
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageMeta title="Kelola Tahun Ajaran" description="Kelola data tahun ajaran" />
            <PageBreadcrumb pageTitle="Kelola Tahun Ajaran" />
            <div className="space-y-6 relative">
                <ComponentCard title="Data Tahun Ajaran">
                    <div className="mb-4 flex justify-end">
                        <Button size="sm" variant="primary" onClick={handleAdd}>
                            Tambah Data
                        </Button>
                    </div>
                    <BasicTableOne columns={columns} data={data} />
                </ComponentCard>

                {/* Popup form */}
                {showForm && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center mt-20 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                                {formMode === "add" ? "Tambah Tahun Ajaran" : "Edit Tahun Ajaran"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Nama Tahun */}
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                                        Nama Tahun
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={formData.nama_tahun ?? ""}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                nama_tahun: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>

                                {/* Semester */}
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                                        Semester
                                    </label>
                                    <select
                                        className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={formData.semester_ajaran ?? ""}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                semester_ajaran: e.target.value,
                                            }))
                                        }
                                        required
                                    >
                                        <option value="">Pilih Semester</option>
                                        <option value="Ganjil">Ganjil</option>
                                        <option value="Genap">Genap</option>
                                    </select>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                                        Status
                                    </label>
                                    <select
                                        className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={formData.status_tahun_ajaran ?? ""}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                status_tahun_ajaran: e.target.value,
                                            }))
                                        }
                                        required
                                    >
                                        <option value="">Pilih Status</option>
                                        <option value="aktif">Aktif</option>
                                        <option value="nonaktif">Nonaktif</option>
                                    </select>
                                </div>

                                {/* Tombol Aksi */}
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
