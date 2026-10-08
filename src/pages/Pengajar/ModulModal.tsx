// ========================================
// FILE: ModulModal.tsx
// Path: src/pages/components/ModulModal.tsx
// ========================================

import { useState } from "react";
import { supabase } from "../../lib/supabaseclient";
import { Upload, Film, Loader2, Save } from "lucide-react";

interface ModulModalProps {
    activityId: number;
    onBack: () => void;
    onSuccess: () => void;
}

export default function ModulModal({ activityId, onBack, onSuccess }: ModulModalProps) {
    const [uploading, setUploading] = useState(false);
    const [modulForm, setModulForm] = useState({
        judul: '',
        deskripsi: '',
        url_video: ''
    });
    const [modulFile, setModulFile] = useState<File | null>(null);

    const handleModulChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setModulForm(prev => ({ ...prev, [name]: value }));
    };

    const handleModulFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setModulFile(e.target.files[0]);
        }
    };

    const handleModulSubmit = async () => {
        if (!modulForm.judul.trim() || !modulForm.deskripsi.trim()) {
            alert('Judul dan Deskripsi tidak boleh kosong.');
            return;
        }

        setUploading(true);
        let fileUrl: string | null = null;

        if (modulFile) {
            const BUCKET_NAME = 'modul';
            const fileExt = modulFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `public/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, modulFile);

            if (uploadError) {
                console.error("Gagal upload file:", uploadError);
                alert("Gagal upload file.");
                setUploading(false);
                return;
            }

            const { data } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);

            fileUrl = data.publicUrl;
        }

        try {
            const { error } = await supabase.from('modul').insert({
                judul: modulForm.judul,
                deskripsi: modulForm.deskripsi,
                file_modul: fileUrl,
                url_video: modulForm.url_video || null,
                id_activity: activityId
            });

            if (error) throw error;

            alert("Modul berhasil ditambahkan!");
            setModulForm({ judul: '', deskripsi: '', url_video: '' });
            setModulFile(null);
            onSuccess();
        } catch (error: any) {
            console.error("Gagal menyimpan modul:", JSON.stringify(error, null, 2));
            alert("Gagal menyimpan modul. Cek konsol (Ctrl + Shift + I → tab Console) untuk detail error-nya.");
        } finally {
            setUploading(false);
        }

    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">📘 Tambah Modul</h2>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Judul
                </label>
                <input
                    type="text"
                    name="judul"
                    value={modulForm.judul}
                    onChange={handleModulChange}
                    placeholder="Masukkan judul modul..."
                    className="w-full border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deskripsi
                </label>
                <textarea
                    name="deskripsi"
                    value={modulForm.deskripsi}
                    onChange={handleModulChange}
                    rows={4}
                    placeholder="Masukkan deskripsi modul..."
                    className="w-full border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL Video YouTube (Opsional)
                </label>
                <div className="relative">
                    <Film className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="url"
                        name="url_video"
                        value={modulForm.url_video}
                        onChange={handleModulChange}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md p-2 pl-10 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Upload File Modul (Opsional)
                </label>
                <label className="flex items-center justify-center w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                    <Upload className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {modulFile ? modulFile.name : 'Pilih file (PDF/Dokumen)...'}
                    </span>
                    <input type="file" onChange={handleModulFileChange} className="hidden" />
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Anda dapat memilih URL Video atau File, atau keduanya.
                </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={onBack}
                    disabled={uploading}
                    className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                    Batal
                </button>
                <button
                    onClick={handleModulSubmit}
                    disabled={uploading || !modulForm.judul.trim() || !modulForm.deskripsi.trim()}
                    className="flex items-center px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm transition disabled:opacity-50"
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {uploading ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </div>
    );
}