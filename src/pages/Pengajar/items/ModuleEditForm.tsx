// components/forms/ModuleEditForm.tsx
import { FileUp, Film, AlertCircle, Loader2, Upload, X, Plus } from "lucide-react";
import { useState } from "react";
import { supabase } from "../../../lib/supabaseclient";

interface ModuleEditFormProps {
    editData: any;
    setEditData: (data: any) => void;
    onCancel: () => void;
    onSave: () => void;
}

export default function ModuleEditForm({
    editData,
    setEditData,
    onCancel,
    onSave,
}: ModuleEditFormProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modulFile, setModulFile] = useState<File | null>(null);
    const [fileList, setFileList] = useState<string[]>(
        Array.isArray(editData.file_modul) ? editData.file_modul : (editData.file_modul ? [editData.file_modul] : [])
    );

    const handleModulChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditData({ ...editData, [name]: value });
        setError(null);
    };

    const handleModulFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setModulFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleFileUpload = async () => {
        if (!modulFile) return;

        setUploading(true);
        setError(null);

        try {
            let BUCKET_NAME = 'modul';

            // Extract bucket name dari URL jika ada file lama
            if (fileList.length > 0 && fileList[0]) {
                const urlParts = fileList[0].split('/');
                const publicIndex = urlParts.indexOf('public');

                if (publicIndex !== -1 && publicIndex + 1 < urlParts.length) {
                    BUCKET_NAME = urlParts[publicIndex + 1];
                }
            }

            console.log("Using bucket:", BUCKET_NAME);

            const fileExt = modulFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `public/${fileName}`;

            console.log("Uploading file:", { fileName, filePath, bucket: BUCKET_NAME });

            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, modulFile);

            if (uploadError) {
                console.error("Gagal upload file:", uploadError);
                setError(`Gagal upload file: ${uploadError.message}. Bucket: ${BUCKET_NAME}`);
                setUploading(false);
                return;
            }

            const { data } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);

            console.log("File uploaded successfully:", data.publicUrl);

            // Add to file list (support multiple files)
            const newFileList = [...fileList, data.publicUrl];
            setFileList(newFileList);
            setEditData({ ...editData, file_modul: newFileList });
            setModulFile(null);
            alert("File berhasil di-upload!");
        } catch (err: any) {
            console.error("Error upload:", err);
            setError(`Error saat upload file: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteFile = async (fileUrl: string, index: number) => {
        if (!fileUrl) return;

        if (!window.confirm("Yakin ingin menghapus file ini?")) return;

        try {
            setError(null);

            const urlParts = fileUrl.split('/');
            const publicIndex = urlParts.indexOf('public');
            let BUCKET_NAME = 'modul';
            let fileName = '';

            if (publicIndex !== -1) {
                if (publicIndex + 1 < urlParts.length) {
                    BUCKET_NAME = urlParts[publicIndex + 1];
                }
                // Get all parts after bucket name
                if (publicIndex + 2 < urlParts.length) {
                    fileName = urlParts.slice(publicIndex + 2).join('/');
                }
            }

            console.log("Deleting file:", { fileName, bucket: BUCKET_NAME, index });

            if (fileName) {
                const { error: deleteError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .remove([fileName]);

                if (deleteError) {
                    console.error("Delete error:", deleteError);
                    setError(`Gagal menghapus file: ${deleteError.message}`);
                    return;
                }

                // Remove from file list
                const newFileList = fileList.filter((_, i) => i !== index);
                setFileList(newFileList);
                setEditData({ ...editData, file_modul: newFileList.length > 0 ? newFileList : null });
                alert("File berhasil dihapus!");
            }
        } catch (err: any) {
            console.error("Error delete:", err);
            setError(`Gagal menghapus file: ${err.message}`);
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3 border-l-4 border-blue-500">
            {/* Error Alert */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Judul */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Judul Modul <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="judul"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    value={editData.judul || ""}
                    onChange={handleModulChange}
                    placeholder="Masukkan judul modul..."
                />
            </div>

            {/* Deskripsi */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Deskripsi <span className="text-red-500">*</span>
                </label>
                <textarea
                    name="deskripsi"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    rows={2}
                    value={editData.deskripsi || ""}
                    onChange={handleModulChange}
                    placeholder="Masukkan deskripsi modul..."
                />
            </div>

            {/* URL Video YouTube */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Film className="w-4 h-4" /> URL Video YouTube (Opsional)
                </label>
                <input
                    type="text"
                    name="url_video"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    value={editData.url_video || ""}
                    onChange={handleModulChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                />
                <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-400 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">Format YouTube:</p>
                        <p>https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
                        <p>atau https://youtu.be/dQw4w9WgXcQ</p>
                    </div>
                </div>
            </div>

            {/* File Upload Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <FileUp className="w-4 h-4" /> Upload File (Support Multiple)
                </label>

                {/* Current Files List */}
                {fileList.length > 0 && (
                    <div className="mb-3 space-y-2">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                            ✓ File yang tersedia ({fileList.length}):
                        </p>
                        {fileList.map((fileUrl, index) => (
                            <div key={index} className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded flex items-center justify-between">
                                <p className="text-xs text-green-600 dark:text-green-300 break-all truncate flex-1">
                                    {index + 1}. {fileUrl.split('/').pop()}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteFile(fileUrl, index)}
                                    className="ml-2 text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition flex-shrink-0"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* File Input */}
                {!modulFile ? (
                    <label className="flex items-center justify-center w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        <div className="flex items-center gap-2">
                            <Upload className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <span className="text-xs text-gray-700 dark:text-gray-300">
                                Klik untuk memilih file
                            </span>
                        </div>
                        <input
                            type="file"
                            onChange={handleModulFileChange}
                            disabled={uploading}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip"
                        />
                    </label>
                ) : (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                        <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                            File terpilih:
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-300 break-all mb-2">
                            {modulFile.name}
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleFileUpload}
                                disabled={uploading}
                                className="flex items-center gap-1 flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading && <Loader2 className="w-3 h-3 animate-spin" />}
                                {uploading ? "Uploading..." : "Upload File"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setModulFile(null)}
                                disabled={uploading}
                                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition disabled:opacity-50 flex items-center gap-1"
                            >
                                <X className="w-3 h-3" />
                                Batal
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-400">
                    <p className="font-semibold mb-1">Format yang didukung:</p>
                    <p>PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG, ZIP (Max 50MB)</p>
                    <p className="mt-1">💡 Bisa upload multiple file dengan mengklik "Tambah File" berkali-kali</p>
                </div>
            </div>

            {/* Preview Info */}
            {(editData.url_video || fileList.length > 0) && (
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded text-xs text-purple-700 dark:text-purple-400">
                    <p className="font-semibold mb-1">Preview:</p>
                    {editData.url_video && (
                        <p>✓ Video YouTube akan ditampilkan dengan embedded player</p>
                    )}
                    {fileList.length > 0 && (
                        <p>✓ {fileList.length} file akan ditampilkan sebagai link download</p>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={onCancel}
                    disabled={uploading}
                    className="px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Batal
                </button>
                <button
                    onClick={onSave}
                    disabled={uploading || !editData.judul || !editData.deskripsi}
                    className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Simpan Perubahan
                </button>
            </div>
        </div>
    );
}