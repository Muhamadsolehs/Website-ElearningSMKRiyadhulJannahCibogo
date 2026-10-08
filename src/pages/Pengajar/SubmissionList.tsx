// components/SubmissionList.tsx
import { Plus, Film, CheckSquare, Brain, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseclient";
import ModuleItem from "./items/ModuleItem";
import SubmissionItem from "./items/SubmissionItem";
import ModuleEditForm from "./items/ModuleEditForm";

interface SubmissionListProps {
    activity: any;
    onAddSubmission: () => void;
    onRefresh: () => void;
}

export default function SubmissionList({
    activity,
    onAddSubmission,
    onRefresh,
}: SubmissionListProps) {
    const [editingId, setEditingId] = useState<{ type: string; id: number } | null>(null);
    const [editData, setEditData] = useState<any>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    const handleDelete = async (type: string, id: number) => {
        if (!window.confirm(`Yakin ingin menghapus ${type} ini?`)) return;
        try {
            await supabase.from(type).delete().eq(`id_${type}`, id);
            onRefresh();
        } catch (error) {
            console.error("Error:", error);
            alert(`Gagal menghapus ${type}`);
        }
    };

    const handleEditStart = (type: string, item: any) => {
        setEditingId({ type, id: item[`id_${type}`] });
        setEditData({ ...item });
        setSaveError(null);
    };

    const handleEditSave = async () => {
        if (!editingId) return;

        try {
            setSaveError(null);

            // Validate required fields
            if (!editData.judul_tugas && !editData.judul && !editData.judul_kuis) {
                setSaveError("Judul tidak boleh kosong");
                return;
            }

            if (!editData.deskripsi) {
                setSaveError("Deskripsi tidak boleh kosong");
                return;
            }

            // Prepare data untuk di-save
            const dataToSave: any = {};

            // Map field berdasarkan type
            if (editingId.type === "modul") {
                dataToSave.judul = editData.judul || "";
                dataToSave.deskripsi = editData.deskripsi || "";

                // Save url_video
                if (editData.url_video) {
                    dataToSave.url_video = editData.url_video;
                }

                // Save file_modul (bisa array atau null)
                if (editData.file_modul) {
                    // Jika array, simpan sebagai JSON string
                    if (Array.isArray(editData.file_modul)) {
                        dataToSave.file_modul = editData.file_modul.length > 0 ? editData.file_modul : null;
                    } else {
                        // Jika string, simpan langsung
                        dataToSave.file_modul = editData.file_modul;
                    }
                } else {
                    dataToSave.file_modul = null;
                }
            } else if (editingId.type === "tugas") {
                dataToSave.judul = editData.judul || "";
                dataToSave.deskripsi = editData.deskripsi || "";


                // OPEN wajib
                if (!editData.open) {
                    setSaveError("Tanggal Open wajib diisi");
                    return;
                }
                dataToSave.open = editData.open;


                // Deadline (opsional)
                dataToSave.deadline = editData.deadline || null;

                // File tugas
                dataToSave.file_tugas = editData.file_tugas || null;

            } else if (editingId.type === "kuis") {
                dataToSave.judul = editData.judul || "";
                dataToSave.deskripsi = editData.deskripsi || "";

                // OPEN wajib
                dataToSave.open = editData.open;

                // Durasi opsional
                if (editData.durasi !== null && editData.durasi !== undefined) {
                    dataToSave.durasi = editData.durasi;
                }

                // Deadline opsional
                dataToSave.deadline = editData.deadline || null;
            }




            console.log("Saving data:", {
                type: editingId.type,
                id: editingId.id,
                data: dataToSave
            });

            const { error } = await supabase
                .from(editingId.type)
                .update(dataToSave)
                .eq(`id_${editingId.type}`, editingId.id);

            if (error) {
                console.error("Supabase error:", error);
                setSaveError(`Error: ${error.message}`);
                return;
            }

            setEditingId(null);
            setEditData(null);
            setSaveError(null);
            onRefresh();
            alert("Perubahan berhasil disimpan!");
        } catch (error: any) {
            console.error("Exception error:", error);
            setSaveError(`Exception: ${error.message}`);
        }
    };

    // Format datetime untuk input datetime-local
    const formatDatetimeLocal = (dateString: string | null | undefined) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (e) {
            console.error("Format error:", e);
            return "";
        }
    };

    const isEmpty =
        activity.modul.length === 0 &&
        activity.tugas.length === 0 &&
        activity.kuis.length === 0;

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            {isEmpty ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-6">
                    Belum ada submission dalam aktivitas ini.
                </p>
            ) : (
                <>
                    {/* MODUL SECTION */}
                    {activity.modul.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <Film className="w-5 h-5 text-blue-500" />
                                Modul ({activity.modul.length})
                            </h3>
                            <div className="space-y-2 pl-7">
                                {activity.modul.map((m: any) => (
                                    <div key={m.id_modul}>
                                        {editingId && editingId.id === m.id_modul && editingId.type === "modul" ? (
                                            <ModuleEditForm
                                                editData={editData}
                                                setEditData={setEditData}
                                                onCancel={() => {
                                                    setEditingId(null);
                                                    setEditData(null);
                                                    setSaveError(null);
                                                }}
                                                onSave={handleEditSave}
                                            />
                                        ) : (
                                            <ModuleItem
                                                modul={m}
                                                onEdit={() => handleEditStart("modul", m)}
                                                onDelete={() => handleDelete("modul", m.id_modul)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TUGAS SECTION */}
                    {activity.tugas.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-green-500" />
                                Tugas ({activity.tugas.length})
                            </h3>
                            <div className="space-y-2 pl-7">
                                {activity.tugas.map((t: any) => (
                                    <div key={t.id_tugas} className="relative">
                                        {editingId && editingId.id === t.id_tugas && editingId.type === "tugas" ? (
                                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3 border-l-4 border-green-500">
                                                {/* Error Alert */}
                                                {saveError && (
                                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                                        <p className="text-xs text-red-700 dark:text-red-400">
                                                            <strong>Error:</strong> {saveError}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Judul Tugas */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Judul Tugas <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                        value={editData.judul || editData.judul || ""}
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                judul_tugas: e.target.value,
                                                                judul: e.target.value
                                                            })
                                                        }
                                                        placeholder="Masukkan judul tugas..."
                                                    />
                                                </div>

                                                {/* Deskripsi */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Deskripsi <span className="text-red-500">*</span>
                                                    </label>
                                                    <textarea
                                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                        rows={2}
                                                        value={editData.deskripsi || ""}
                                                        onChange={(e) =>
                                                            setEditData({ ...editData, deskripsi: e.target.value })
                                                        }
                                                        placeholder="Masukkan deskripsi tugas..."
                                                    />
                                                </div>

                                                {/* Open (Wajib) */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Open <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                        value={formatDatetimeLocal(editData.open)}
                                                        onChange={(e) =>
                                                            setEditData({ ...editData, open: e.target.value })
                                                        }
                                                    />
                                                </div>


                                                {/* Deadline */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Deadline (Opsional)
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                        value={formatDatetimeLocal(editData.deadline)}
                                                        onChange={(e) =>
                                                            setEditData({ ...editData, deadline: e.target.value || null })
                                                        }
                                                    />
                                                    {editData.deadline && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            Deadline: {new Date(editData.deadline).toLocaleString("id-ID")}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Current File Info */}
                                                {editData.file_tugas && (
                                                    <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                                                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                                                            ✓ File saat ini:
                                                        </p>
                                                        <p className="text-xs text-green-600 dark:text-green-300 break-all truncate">
                                                            {editData.file_tugas.split('/').pop()}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditData(null);
                                                            setSaveError(null);
                                                        }}
                                                        className="px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                                                    >
                                                        Batal
                                                    </button>
                                                    <button
                                                        onClick={handleEditSave}
                                                        disabled={!editData.judul_tugas && !editData.judul}
                                                        className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Simpan Perubahan
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <SubmissionItem
                                                item={t}
                                                type="tugas"
                                                onEdit={() => handleEditStart("tugas", t)}
                                                onDelete={() => handleDelete("tugas", t.id_tugas)}
                                            />
                                        )}
                                        {!editingId || editingId.id !== t.id_tugas || editingId.type !== "tugas" ? (
                                            <Link
                                                to={`/Pengajar/TaskPreview/${t.id_tugas}`}
                                                className="absolute right-4 bottom-4 text-blue-500 hover:text-blue-600 transition"
                                                title="Lihat Preview"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* KUIS SECTION */}
                    {activity.kuis.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-purple-500" />
                                Kuis ({activity.kuis.length})
                            </h3>
                            <div className="space-y-2 pl-7">
                                {activity.kuis.map((k: any) => (
                                    <div key={k.id_kuis} className="relative">
                                        {editingId && editingId.id === k.id_kuis && editingId.type === "kuis" ? (
                                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3 border-l-4 border-purple-500">
                                                {/* Error Alert */}
                                                {saveError && (
                                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                                        <p className="text-xs text-red-700 dark:text-red-400">
                                                            <strong>Error:</strong> {saveError}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Judul Kuis */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Judul Kuis <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                                        value={editData.judul || editData.judul || ""}
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                judul_kuis: e.target.value,
                                                                judul: e.target.value
                                                            })
                                                        }
                                                        placeholder="Masukkan judul kuis..."
                                                    />
                                                </div>

                                                {/* Deskripsi */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Deskripsi <span className="text-red-500">*</span>
                                                    </label>
                                                    <textarea
                                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                                        rows={2}
                                                        value={editData.deskripsi || ""}
                                                        onChange={(e) =>
                                                            setEditData({ ...editData, deskripsi: e.target.value })
                                                        }
                                                        placeholder="Masukkan deskripsi kuis..."
                                                    />
                                                </div>

                                                {/* Durasi */}
                                                {editData.durasi !== undefined && editData.durasi !== null && (
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                            Durasi (menit) - Opsional
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                                            value={editData.durasi || ""}
                                                            onChange={(e) =>
                                                                setEditData({
                                                                    ...editData,
                                                                    durasi: e.target.value ? parseInt(e.target.value) : null
                                                                })
                                                            }
                                                            placeholder="Contoh: 60"
                                                            min="1"
                                                            max="480"
                                                        />
                                                        {editData.durasi && (
                                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                                ✓ {editData.durasi} menit
                                                            </p>
                                                        )}
                                                    </div>
                                                )}



                                                {/* Deadline */}

                                                {/* Open (Wajib) */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Open <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                                        value={formatDatetimeLocal(editData.open)}
                                                        onChange={(e) =>
                                                            setEditData({ ...editData, open: e.target.value })
                                                        }
                                                    />
                                                </div>


                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Deadline (Opsional)
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                                        value={formatDatetimeLocal(editData.deadline)}
                                                        onChange={(e) =>
                                                            setEditData({ ...editData, deadline: e.target.value || null })
                                                        }
                                                    />
                                                    {editData.deadline && (
                                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                            ✓ {new Date(editData.deadline).toLocaleString("id-ID")}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditData(null);
                                                            setSaveError(null);
                                                        }}
                                                        className="px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                                                    >
                                                        Batal
                                                    </button>
                                                    <button
                                                        onClick={handleEditSave}
                                                        disabled={!editData.judul && !editData.judul}
                                                        className="px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Simpan Perubahan
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <SubmissionItem
                                                item={k}
                                                type="kuis"
                                                onEdit={() => handleEditStart("kuis", k)}
                                                onDelete={() => handleDelete("kuis", k.id_kuis)}
                                            />
                                        )}
                                        {!editingId || editingId.id !== k.id_kuis || editingId.type !== "kuis" ? (
                                            <Link
                                                to={`/Pengajar/QuizPreview/${k.id_kuis}`}
                                                className="absolute right-4 bottom-4 text-blue-500 hover:text-blue-600 transition"
                                                title="Lihat Preview"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                    onClick={onAddSubmission}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition"
                >
                    <Plus className="w-5 h-5" /> Tambah Submission
                </button>
            </div>
        </div>
    );
}