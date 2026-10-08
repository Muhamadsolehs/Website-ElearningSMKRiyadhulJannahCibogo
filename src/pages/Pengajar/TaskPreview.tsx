// pages/TaskPreview.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseclient";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ArrowLeft, Download, Trash2, Save } from "lucide-react";

interface SiswaData {
    nama: string;
    nis: string;
}

interface Task {
    id_tugas: number;
    judul_tugas: string;
    deskripsi: string;
    deadline: string;
    id_activity: number;
}

interface Submission {
    id: number;
    id_tugas: number;
    id_siswa: number;
    file_url: string;
    status_pengumpulan: string;
    nilai: number | null;
    feedback: string | null;
    created_at: string;
    updated_at: string;
    siswa?: SiswaData;
}

export default function TaskPreview() {
    const params = useParams();
    const id_tugas = params.id_tugas || Object.values(params)[0];
    const navigate = useNavigate();

    const [task, setTask] = useState<Task | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<{ nilai: string; feedback: string }>({
        nilai: "",
        feedback: "",
    });
    const [savingId, setSavingId] = useState<number | null>(null);

    const fetchTaskAndSubmissions = async () => {
        try {
            // Fetch task
            const { data: taskData } = await supabase
                .from("tugas")
                .select("*")
                .eq("id_tugas", Number(id_tugas));

            if (taskData && taskData.length > 0) {
                setTask(taskData[0] as Task);
            }

            // Fetch submissions
            const { data: allSubs } = await supabase
                .from("pengumpulan_tugas")
                .select("*");

            // Filter by id_tugas dari hasil lokal
            const submissionData = allSubs?.filter((s: any) => s.id_tugas === Number(id_tugas)) || [];

            if (submissionData && submissionData.length > 0) {
                // Ambil semua siswa
                const { data: siswaData } = await supabase
                    .from("siswa")
                    .select("id_siswa, nama, nis");

                // Map siswa data to submissions
                const siswaMap = new Map();
                if (siswaData) {
                    siswaData.forEach((s: any) => {
                        siswaMap.set(s.id_siswa, {
                            nama: s.nama,
                            nis: s.nis
                        });
                    });
                }

                const formattedSubmissions: Submission[] = submissionData.map((item: any) => ({
                    id: item.id,
                    id_tugas: item.id_tugas,
                    id_siswa: item.id_siswa,
                    file_url: item.file_url,
                    status_pengumpulan: item.status_pengumpulan,
                    nilai: item.nilai,
                    feedback: item.feedback,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                    siswa: siswaMap.get(item.id_siswa),
                }));
                setSubmissions(formattedSubmissions);
            }
        } catch (error) {
            console.error("Error fetching task:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id_tugas) {
            fetchTaskAndSubmissions();
        }
    }, [id_tugas]);

    const downloadFile = async (fileUrl: string) => {
        try {
            console.log("Downloading file:", fileUrl);

            // Gunakan URL langsung dari Supabase (jika public)
            // atau extract dan download via API
            const a = document.createElement("a");
            a.href = fileUrl;
            a.target = "_blank";

            // Extract filename dari URL
            const urlParts = fileUrl.split("/");
            const encodedFilename = urlParts[urlParts.length - 1];
            const filename = decodeURIComponent(encodedFilename);

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            console.log("File download initiated:", filename);
        } catch (error) {
            console.error("Error downloading file:", error);
            alert("Gagal mengunduh file");
        }
    };

    const deleteSubmission = async (id: number) => {
        if (!window.confirm("Yakin ingin menghapus pengumpulan ini?")) return;

        try {
            await supabase
                .from("pengumpulan_tugas")
                .delete()
                .eq("id", id);

            setSubmissions((prev) => prev.filter((s) => s.id !== id));
            alert("Pengumpulan berhasil dihapus!");
        } catch (error) {
            console.error("Error deleting submission:", error);
            alert("Gagal menghapus pengumpulan");
        }
    };

    const startEdit = (submission: Submission) => {
        setEditingId(submission.id);
        setEditValues({
            nilai: submission.nilai?.toString() || "",
            feedback: submission.feedback || "",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValues({ nilai: "", feedback: "" });
    };

    const saveGrade = async (id: number) => {
        if (!editValues.nilai.trim()) {
            alert("Nilai tidak boleh kosong");
            return;
        }

        const nilaiNum = parseInt(editValues.nilai);
        if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
            alert("Nilai harus berupa angka antara 0-100");
            return;
        }

        setSavingId(id);

        try {
            await supabase
                .from("pengumpulan_tugas")
                .update({
                    nilai: nilaiNum,
                    feedback: editValues.feedback || null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id);

            setSubmissions((prev) =>
                prev.map((s) =>
                    s.id === id
                        ? {
                            ...s,
                            nilai: nilaiNum,
                            feedback: editValues.feedback || null,
                        }
                        : s
                )
            );

            setEditingId(null);
            setEditValues({ nilai: "", feedback: "" });
            alert("Nilai berhasil disimpan!");
        } catch (error) {
            console.error("Error saving grade:", error);
            alert("Gagal menyimpan nilai");
        } finally {
            setSavingId(null);
        }
    };

    if (loading) {
        return (
            <div className="p-4 md:p-6">
                <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <PageMeta title="Preview Tugas" description="Preview pengumpulan tugas siswa" />
            <PageBreadcrumb pageTitle="Preview Tugas" />

            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-700"
            >
                <ArrowLeft className="w-5 h-5" />
                Kembali
            </button>

            {task && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {task.judul_tugas}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {task.deskripsi}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                Deadline:
                            </span>
                            <p className="text-gray-600 dark:text-gray-400">
                                {task.deadline ? new Date(task.deadline).toLocaleDateString("id-ID") : "-"}
                            </p>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                Total Pengumpul:
                            </span>
                            <p className="text-gray-600 dark:text-gray-400">{submissions.length} siswa</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Pengumpulan Tugas
                    </h2>
                </div>

                {submissions.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-gray-500 dark:text-gray-400">Belum ada pengumpulan tugas</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nama Siswa
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                        NIS
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tanggal Submit
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nilai
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Feedback
                                    </th>
                                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {submissions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {sub.siswa?.nama || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {sub.siswa?.nis || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(sub.created_at).toLocaleDateString("id-ID", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${sub.status_pengumpulan === "submitted"
                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                : sub.status_pengumpulan === "dinilai"
                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                                }`}>
                                                {sub.status_pengumpulan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {editingId === sub.id ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={editValues.nilai}
                                                    onChange={(e) =>
                                                        setEditValues({ ...editValues, nilai: e.target.value })
                                                    }
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    placeholder="Nilai"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span>{sub.nilai ? `${sub.nilai}` : "-"}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                                            {editingId === sub.id ? (
                                                <textarea
                                                    value={editValues.feedback}
                                                    onChange={(e) =>
                                                        setEditValues({ ...editValues, feedback: e.target.value })
                                                    }
                                                    className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs"
                                                    placeholder="Feedback (opsional)"
                                                    rows={2}
                                                />
                                            ) : (
                                                <span className="truncate block" title={sub.feedback || ""}>
                                                    {sub.feedback || "-"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                {editingId === sub.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => saveGrade(sub.id)}
                                                            disabled={savingId === sub.id}
                                                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded transition whitespace-nowrap"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                            Simpan
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-gray-400 hover:bg-gray-500 text-white rounded transition whitespace-nowrap"
                                                        >
                                                            Batal
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {sub.file_url && (
                                                            <button
                                                                onClick={() => downloadFile(sub.file_url)}
                                                                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition whitespace-nowrap"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                                Download
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => startEdit(sub)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded transition whitespace-nowrap"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteSubmission(sub.id)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition whitespace-nowrap"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Hapus
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}