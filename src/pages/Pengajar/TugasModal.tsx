// TugasModal.tsx
import { useState } from "react";
import { supabase } from "../../lib/supabaseclient";
import { Upload, Loader2, Save, AlertCircle, Clock } from "lucide-react";

const BUCKET_NAME = "modul";

interface TugasModalProps {
    activityId: number;
    onBack: () => void;
    onSuccess: () => void;
}

export default function TugasModal({ activityId, onBack, onSuccess }: TugasModalProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tugasForm, setTugasForm] = useState({
        judul: "",
        deskripsi: "",
        open: "",
        deadline: "",
    });
    const [tugasFile, setTugasFile] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTugasForm((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setTugasFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleSubmit = async () => {
        setError(null);

        if (!tugasForm.judul.trim()) return setError("Judul tugas tidak boleh kosong.");
        if (!tugasForm.deskripsi.trim()) return setError("Deskripsi tugas tidak boleh kosong.");
        if (!tugasForm.open) return setError("Waktu dibuka harus diisi.");
        if (!tugasForm.deadline) return setError("Deadline harus diisi.");


        setUploading(true);
        let fileUrl: string | null = null;

        try {
            // Upload file ke Supabase Storage (jika ada)
            if (tugasFile) {
                const fileExt = tugasFile.name.split(".").pop();
                const safeName = tugasFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
                const fileName = `${Date.now()}_${safeName}`;
                const filePath = `tugas/${activityId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, tugasFile, {
                        cacheControl: "3600",
                        upsert: false,
                    });

                if (uploadError) {
                    console.error("Gagal upload file:", uploadError);
                    setError(`Gagal upload file: ${uploadError.message}`);
                    setUploading(false);
                    return;
                }

                // Dapatkan URL publik
                const { data } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(filePath);

                fileUrl = data.publicUrl;
            }

            // Simpan data ke tabel tugas
            const insertData: any = {
                judul: tugasForm.judul.trim(),
                deskripsi: tugasForm.deskripsi.trim(),
                id_activity: activityId,
            };

            // Tambah file jika ada
            if (fileUrl) {
                insertData.file_tugas = fileUrl;
            }

            // Tambah dibuka jika ada
            if (tugasForm.open) {
                insertData.open = new Date(tugasForm.open).toISOString();
            }

            // Tambah deadline jika ada
            if (tugasForm.deadline) {
                insertData.deadline = new Date(tugasForm.deadline).toISOString();
            }

            const { error: dbError } = await supabase.from("tugas").insert(insertData);

            if (dbError) throw dbError;

            // Reset form
            setTugasForm({ judul: "", deskripsi: "", open: "", deadline: "" });
            setTugasFile(null);
            onSuccess();
        } catch (err: any) {
            console.error("Gagal menyimpan tugas:", err);
            setError(err.message || "Terjadi kesalahan saat menyimpan tugas.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                📝 Tambah Tugas
            </h2>

            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {/* Judul Tugas */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Judul Tugas <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="judul"
                    value={tugasForm.judul}
                    onChange={handleChange}
                    placeholder="Contoh: Tugas Kalkulus 1"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Nama atau topik tugas yang akan diberikan kepada siswa
                </p>
            </div>

            {/* Deskripsi Tugas */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Deskripsi Tugas <span className="text-red-500">*</span>
                </label>
                <textarea
                    name="deskripsi"
                    value={tugasForm.deskripsi}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Jelaskan apa yang harus dikerjakan siswa, instruksi, dan ketentuan tugas..."
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Penjelasan detail tentang tugas dan instruksi pengerjaan
                </p>
            </div>

            {/* Dibuka & Deadline */}
            <div className="grid grid-cols-2 gap-4">
                {/* Dibuka */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Dibuka
                    </label>
                    <input
                        type="datetime-local"
                        name="open"
                        value={tugasForm.open}
                        onChange={handleChange}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Kapan tugas dibuka untuk siswa
                    </p>
                </div>

                {/* Deadline */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Deadline
                    </label>
                    <input
                        type="datetime-local"
                        name="deadline"
                        value={tugasForm.deadline}
                        onChange={handleChange}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Batas waktu pengumpulan tugas
                    </p>
                </div>
            </div>

            {/* Upload File Tugas */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Upload File Tugas (Opsional)
                </label>
                <label className="flex items-center justify-center w-full px-4 py-6 bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {tugasFile ? tugasFile.name : "Pilih file untuk diunggah"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            PDF, DOC, DOCX, ZIP, atau format dokumen lainnya
                        </span>
                    </div>
                    <input type="file" onChange={handleFileChange} className="hidden" />
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    File panduan atau soal tugas untuk siswa (bisa dikosongkan jika tugas ada di modul)
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={onBack}
                    disabled={uploading}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                    Batal
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={uploading || !tugasForm.judul.trim() || !tugasForm.deskripsi.trim()}
                    className="flex items-center px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition disabled:opacity-50"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Simpan Tugas
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}