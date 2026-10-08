// KuisModal.tsx
import { useState } from "react";
import { supabase } from "../../lib/supabaseclient";
import { Loader2, Save, AlertCircle, Plus, Trash2, Upload, ChevronLeft, Clock } from "lucide-react";

interface KuisModalProps {
    activityId: number;
    onBack: () => void;
    onSuccess: () => void;
}

interface FormErrors {
    judul?: string;
    deskripsi?: string;
    durasi?: string;
    open?: string;
    deadline?: string;
}

interface Soal {
    id: string;
    tipe: 'essay' | 'pilihan_ganda';
    pertanyaan: string;
    opsi?: { label: string; text: string }[];
    kunci_jawaban?: string;
    bobot?: number;
}

type Step = 'kuis_info' | 'soal_input';

export default function KuisModal({ activityId, onBack, onSuccess }: KuisModalProps) {
    // ==================== STATE ====================
    const [step, setStep] = useState<Step>('kuis_info');
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const [kuisForm, setKuisForm] = useState({
        judul: '',
        deskripsi: '',
        durasi: '',
        open: '',
        deadline: ''
    });

    const [soalList, setSoalList] = useState<Soal[]>([]);
    const [currentSoal, setCurrentSoal] = useState<Partial<Soal>>({
        id: Date.now().toString(),
        tipe: 'pilihan_ganda',
        pertanyaan: '',
        opsi: [
            { label: 'A', text: '' },
            { label: 'B', text: '' },
            { label: 'C', text: '' },
            { label: 'D', text: '' },
            { label: 'E', text: '' }
        ],
        kunci_jawaban: 'A',
        bobot: 10
    });

    // ==================== STEP 1: KUIS INFO ====================
    const handleKuisChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'durasi') {
            if (value === '' || /^\d+$/.test(value)) {
                setKuisForm(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setKuisForm(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name as keyof FormErrors]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof FormErrors];
                return newErrors;
            });
        }
    };

    const validateKuisInfo = (): boolean => {
        const newErrors: FormErrors = {};

        if (!kuisForm.judul.trim()) {
            newErrors.judul = 'Judul tidak boleh kosong.';
        } else if (kuisForm.judul.trim().length < 3) {
            newErrors.judul = 'Judul minimal 3 karakter.';
        }

        if (!kuisForm.deskripsi.trim()) {
            newErrors.deskripsi = 'Deskripsi tidak boleh kosong.';
        } else if (kuisForm.deskripsi.trim().length < 10) {
            newErrors.deskripsi = 'Deskripsi minimal 10 karakter.';
        }

        if (kuisForm.durasi) {
            const durasi = parseInt(kuisForm.durasi, 10);
            if (isNaN(durasi) || durasi <= 0 || durasi > 480) {
                newErrors.durasi = 'Durasi harus 1-480 menit.';
            }
        }

        if (!kuisForm.open) {
            newErrors.open = 'Tanggal dibuka wajib diisi.';
        } else {
            const dibukaDate = new Date(kuisForm.open);
            if (isNaN(dibukaDate.getTime())) {
                newErrors.open = 'Format tanggal dibuka tidak valid.';
            }
        }


        if (!kuisForm.deadline) {
            newErrors.deadline = 'Deadline wajib diisi.';
        } else {
            const deadlineDate = new Date(kuisForm.deadline);
            const now = new Date();
            if (isNaN(deadlineDate.getTime())) {
                newErrors.deadline = 'Format deadline tidak valid.';
            } else if (deadlineDate <= now) {
                newErrors.deadline = 'Deadline harus di masa depan.';
            }
        }


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (validateKuisInfo()) {
            setStep('soal_input');
        }
    };

    // ==================== STEP 2: SOAL INPUT ====================
    const handleSoalChange = (field: string, value: any) => {
        setCurrentSoal(prev => ({ ...prev, [field]: value }));
    };

    const handleOpsiChange = (index: number, text: string) => {
        setCurrentSoal(prev => {
            const opsi = [...(prev.opsi || [])];
            opsi[index] = { ...opsi[index], text };
            return { ...prev, opsi };
        });
    };

    const validateSoal = (soal: Partial<Soal>): string | null => {
        if (!soal.pertanyaan?.trim()) return 'Pertanyaan tidak boleh kosong';

        if (soal.tipe === 'pilihan_ganda') {
            const opsiTerisi = soal.opsi?.filter(o => o.text.trim()).length || 0;
            if (opsiTerisi < 2) return 'Minimal 2 opsi harus diisi';
            if (!soal.kunci_jawaban) return 'Kunci jawaban harus dipilih';
        }

        if (!soal.bobot || soal.bobot <= 0 || soal.bobot > 32767) {
            return 'Bobot harus antara 1-32767';
        }

        return null;
    };

    const handleAddSoal = () => {
        const validation = validateSoal(currentSoal);
        if (validation) {
            alert(validation);
            return;
        }

        setSoalList(prev => [...prev, currentSoal as Soal]);
        setCurrentSoal({
            id: Date.now().toString(),
            tipe: 'pilihan_ganda',
            pertanyaan: '',
            opsi: [
                { label: 'A', text: '' },
                { label: 'B', text: '' },
                { label: 'C', text: '' },
                { label: 'D', text: '' },
                { label: 'E', text: '' }
            ],
            kunci_jawaban: 'A',
            bobot: 10
        });
    };

    const handleDeleteSoal = (id: string) => {
        setSoalList(prev => prev.filter(s => s.id !== id));
    };

    const handleEditSoal = (soal: Soal) => {
        setCurrentSoal(soal);
        setSoalList(prev => prev.filter(s => s.id !== soal.id));
    };

    // ==================== UPLOAD EXCEL ====================
    const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());

            for (const line of lines) {
                const parts = line.split('|');
                if (parts.length < 3) continue;

                const tipe = parts[0].toLowerCase().includes('essay') ? 'essay' : 'pilihan_ganda';
                const pertanyaan = parts[1];
                const bobot = parseInt(parts[8], 10) || 10;

                if (tipe === 'essay') {
                    setSoalList(prev => [...prev, {
                        id: Date.now().toString() + Math.random(),
                        tipe: 'essay',
                        pertanyaan,
                        bobot
                    }]);
                } else {
                    const opsi = parts.slice(2, 7).map((text, idx) => ({
                        label: String.fromCharCode(65 + idx),
                        text: text.trim()
                    }));
                    setSoalList(prev => [...prev, {
                        id: Date.now().toString() + Math.random(),
                        tipe: 'pilihan_ganda',
                        pertanyaan,
                        opsi,
                        kunci_jawaban: parts[7] || 'A',
                        bobot
                    }]);
                }
            }
            alert('Soal berhasil diimpor dari Excel!');
        } catch (error) {
            alert('Error membaca file: ' + (error as any).message);
        }
    };

    // ==================== SUBMIT ====================
    const handleSubmit = async () => {
        if (soalList.length === 0) {
            alert('Minimal tambah 1 soal');
            return;
        }

        setUploading(true);

        try {
            // 1. Simpan kuis
            const insertKuisData: any = {
                judul: kuisForm.judul.trim(),
                deskripsi: kuisForm.deskripsi.trim(),
                id_activity: activityId
            };

            if (kuisForm.durasi) {
                insertKuisData.durasi = parseInt(kuisForm.durasi, 10);
            }

            if (kuisForm.open) {
                insertKuisData.open = new Date(kuisForm.open).toISOString();
            }

            if (kuisForm.deadline) {
                insertKuisData.deadline = new Date(kuisForm.deadline).toISOString();
            }

            const { data: kuisData, error: kuisError } = await supabase
                .from('kuis')
                .insert([insertKuisData])
                .select('id_kuis')
                .single();

            if (kuisError) throw kuisError;

            // 2. Simpan soal-soal
            const soalToInsert = soalList.map((soal, idx) => {
                const baseData: any = {
                    id_kuis: kuisData.id_kuis,
                    no_soal: (idx + 1).toString(),
                    tipe_soal: soal.tipe,
                    pertanyaan: soal.pertanyaan,
                    jawaban_essay: null,
                    bobot: soal.bobot || 10
                };

                if (soal.tipe === 'pilihan_ganda') {
                    baseData.opsi_a = soal.opsi?.[0].text || null;
                    baseData.opsi_b = soal.opsi?.[1].text || null;
                    baseData.opsi_c = soal.opsi?.[2].text || null;
                    baseData.opsi_d = soal.opsi?.[3].text || null;
                    baseData.opsi_e = soal.opsi?.[4].text || null;
                    baseData.kunci_jawaban = soal.kunci_jawaban || 'A';
                } else {
                    // Untuk essay, isi semua opsi dengan dash
                    baseData.opsi_a = '-';
                    baseData.opsi_b = '-';
                    baseData.opsi_c = '-';
                    baseData.opsi_d = '-';
                    baseData.opsi_e = '-';
                    baseData.kunci_jawaban = '-';
                }

                return baseData;
            });

            const { error: soalError } = await supabase
                .from('soal_kuis')
                .insert(soalToInsert);

            if (soalError) throw soalError;

            alert('Kuis berhasil disimpan!');
            onSuccess();
        } catch (err: any) {
            console.error("Error:", err);
            alert('Gagal menyimpan: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    // ==================== RENDER STEP 1 ====================
    if (step === 'kuis_info') {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">🧩 Informasi Kuis</h2>

                {errors.judul && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-300">{errors.judul}</p>
                    </div>
                )}

                {/* Judul */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Judul <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="judul"
                        value={kuisForm.judul}
                        onChange={handleKuisChange}
                        placeholder="Masukkan judul kuis..."
                        className={`w-full border rounded-lg p-2 text-sm ${errors.judul ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'} text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{kuisForm.judul.length}/100</p>
                </div>

                {/* Deskripsi */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Deskripsi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        name="deskripsi"
                        value={kuisForm.deskripsi}
                        onChange={handleKuisChange}
                        rows={3}
                        placeholder="Masukkan deskripsi kuis..."
                        className={`w-full border rounded-lg p-2 text-sm resize-none ${errors.deskripsi ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'} text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                    />
                </div>

                {/* Durasi, Dibuka & Deadline */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Durasi (menit) <span className="text-gray-500 text-xs">Opsional</span>
                        </label>
                        <input
                            type="text"
                            name="durasi"
                            value={kuisForm.durasi}
                            onChange={handleKuisChange}
                            placeholder="60"
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Dibuka <span className="text-gray-500 text-xs">Opsional</span>
                        </label>
                        <input
                            type="datetime-local"
                            name="open"
                            value={kuisForm.open}
                            onChange={handleKuisChange}
                            className={`w-full border rounded-lg p-2 text-sm ${errors.open ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'} text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500`}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kapan kuis dibuka</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Deadline <span className="text-gray-500 text-xs">Opsional</span>
                        </label>
                        <input
                            type="datetime-local"
                            name="deadline"
                            value={kuisForm.deadline}
                            onChange={handleKuisChange}
                            className={`w-full border rounded-lg p-2 text-sm ${errors.deadline ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'} text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500`}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Batas waktu kuis</p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleNextStep}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition"
                    >
                        Lanjut ke Soal →
                    </button>
                </div>
            </div>
        );
    }

    // ==================== RENDER STEP 2 ====================
    return (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 sticky top-0 bg-white dark:bg-gray-800 pb-2">
                <button
                    onClick={() => setStep('kuis_info')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">📝 Soal Kuis</h2>
            </div>

            {/* Upload Excel */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Upload soal dari File
                    </span>
                    <input type="file" accept=".txt,.csv" onChange={handleUploadExcel} className="hidden" />
                </label>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Format: tipe|pertanyaan|opsi1|opsi2|opsi3|opsi4|opsi5|kunci|bobot
                </p>
            </div>

            {/* Input Soal */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Tambah Soal Baru</h3>

                {/* Tipe Soal */}
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="tipe"
                            checked={currentSoal.tipe === 'pilihan_ganda'}
                            onChange={() => handleSoalChange('tipe', 'pilihan_ganda')}
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">Pilihan Ganda</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="tipe"
                            checked={currentSoal.tipe === 'essay'}
                            onChange={() => handleSoalChange('tipe', 'essay')}
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">Essay</span>
                    </label>
                </div>

                {/* Pertanyaan */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Pertanyaan
                    </label>
                    <textarea
                        value={currentSoal.pertanyaan || ''}
                        onChange={(e) => handleSoalChange('pertanyaan', e.target.value)}
                        placeholder="Masukkan pertanyaan..."
                        rows={2}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Bobot */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bobot <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={currentSoal.bobot || 10}
                        onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            if (value > 0 && value <= 32767) {
                                handleSoalChange('bobot', value);
                            }
                        }}
                        min="1"
                        max="32767"
                        placeholder="10"
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Range: 1-32767</p>
                </div>

                {/* Pilihan Ganda */}
                {currentSoal.tipe === 'pilihan_ganda' && (
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                            Opsi Jawaban (Pilih 1 sebagai kunci)
                        </label>
                        {currentSoal.opsi?.map((opsi, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="kunci"
                                    checked={currentSoal.kunci_jawaban === opsi.label}
                                    onChange={() => handleSoalChange('kunci_jawaban', opsi.label)}
                                    title="Tandai sebagai kunci jawaban"
                                />
                                <span className="w-6 font-bold text-sm">{opsi.label}.</span>
                                <input
                                    type="text"
                                    value={opsi.text}
                                    onChange={(e) => handleOpsiChange(idx, e.target.value)}
                                    placeholder={`Opsi ${opsi.label}`}
                                    className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Essay */}
                {currentSoal.tipe === 'essay' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            ℹ️ Soal essay akan dikoreksi oleh guru. Siswa akan memasukkan jawaban mereka, dan guru akan memberikan nilai pada halaman penilaian.
                        </p>
                    </div>
                )}

                <button
                    onClick={handleAddSoal}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition"
                >
                    <Plus className="w-4 h-4" /> Tambah Soal
                </button>
            </div>

            {/* List Soal */}
            {soalList.length > 0 && (
                <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Soal yang Ditambahkan ({soalList.length})
                    </h3>
                    {soalList.map((soal, idx) => (
                        <div key={soal.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {idx + 1}. {soal.pertanyaan}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Tipe: {soal.tipe === 'essay' ? 'Essay' : 'Pilihan Ganda'} • Bobot: {soal.bobot || 10}
                                    </p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => handleEditSoal(soal)}
                                        className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSoal(soal.id)}
                                        className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
                <button
                    onClick={() => setStep('kuis_info')}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                    ← Kembali
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={uploading || soalList.length === 0}
                    className="flex items-center px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Simpan Kuis & Soal ({soalList.length})
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}