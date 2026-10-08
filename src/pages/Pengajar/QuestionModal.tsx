// components/common/QuestionModal.tsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Question {
    id_soal?: number;
    no_soal?: string;
    pertanyaan?: string;
    tipe_soal?: string;
    opsi_a?: string;
    opsi_b?: string;
    opsi_c?: string;
    opsi_d?: string;
    opsi_e?: string;
    kunci_jawaban?: string;
    jawaban_essay?: string;
    bobot?: number;
}

interface QuestionModalProps {
    question: Question | null;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

interface FormData {
    no_soal: string;
    pertanyaan: string;
    tipe_soal: string;
    opsi_a: string;
    opsi_b: string;
    opsi_c: string;
    opsi_d: string;
    opsi_e: string;
    kunci_jawaban: string;
    jawaban_essay: string;
    bobot: number;
}

export default function QuestionModal({ question, onClose, onSave }: QuestionModalProps) {
    const [formData, setFormData] = useState<FormData>({
        no_soal: "1",
        pertanyaan: "",
        tipe_soal: "pilihan_ganda",
        opsi_a: "",
        opsi_b: "",
        opsi_c: "",
        opsi_d: "",
        opsi_e: "",
        kunci_jawaban: "A",
        jawaban_essay: "",
        bobot: 10,
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (question) {
            setFormData({
                no_soal: question.no_soal || "1",
                pertanyaan: question.pertanyaan || "",
                tipe_soal: question.tipe_soal || "pilihan_ganda",
                opsi_a: question.opsi_a || "",
                opsi_b: question.opsi_b || "",
                opsi_c: question.opsi_c || "",
                opsi_d: question.opsi_d || "",
                opsi_e: question.opsi_e || "",
                kunci_jawaban: question.kunci_jawaban || "A",
                jawaban_essay: question.jawaban_essay || "",
                bobot: question.bobot || 10,
            });
        }
    }, [question]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "bobot") {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue > 0 && numValue <= 32767) {
                setFormData((prev) => ({
                    ...prev,
                    [name]: numValue,
                }));
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.pertanyaan.trim()) {
            alert("Pertanyaan tidak boleh kosong!");
            return;
        }

        if (formData.tipe_soal === "pilihan_ganda") {
            const filledOptions = [
                formData.opsi_a,
                formData.opsi_b,
                formData.opsi_c,
                formData.opsi_d,
                formData.opsi_e,
            ].filter((v) => v.trim());

            if (filledOptions.length < 2) {
                alert("Minimal ada 2 opsi untuk pilihan ganda!");
                return;
            }
        }

        if (!formData.bobot || formData.bobot <= 0 || formData.bobot > 32767) {
            alert("Bobot harus antara 1-32767!");
            return;
        }

        setIsSaving(true);
        try {
            // Prepare data based on question type
            const dataToSave: any = {
                no_soal: formData.no_soal,
                pertanyaan: formData.pertanyaan,
                tipe_soal: formData.tipe_soal,
                jawaban_essay: null,
                bobot: formData.bobot,
            };

            if (formData.tipe_soal === "pilihan_ganda") {
                dataToSave.opsi_a = formData.opsi_a || null;
                dataToSave.opsi_b = formData.opsi_b || null;
                dataToSave.opsi_c = formData.opsi_c || null;
                dataToSave.opsi_d = formData.opsi_d || null;
                dataToSave.opsi_e = formData.opsi_e || null;
                dataToSave.kunci_jawaban = formData.kunci_jawaban || "A";
            } else {
                // Essay: set semua opsi ke '-' dan kunci_jawaban ke '-'
                dataToSave.opsi_a = "-";
                dataToSave.opsi_b = "-";
                dataToSave.opsi_c = "-";
                dataToSave.opsi_d = "-";
                dataToSave.opsi_e = "-";
                dataToSave.kunci_jawaban = "-";
            }

            await onSave(dataToSave);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none pt-32">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full shadow-2xl pointer-events-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {question ? "Edit Soal" : "Tambah Soal Baru"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {/* No Soal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            No. Soal
                        </label>
                        <input
                            type="text"
                            name="no_soal"
                            value={formData.no_soal}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="1, 2, 3..."
                        />
                    </div>

                    {/* Pertanyaan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Pertanyaan *
                        </label>
                        <textarea
                            name="pertanyaan"
                            value={formData.pertanyaan}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Masukkan pertanyaan..."
                        />
                    </div>

                    {/* Tipe Soal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipe Soal
                        </label>
                        <select
                            name="tipe_soal"
                            value={formData.tipe_soal}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="pilihan_ganda">Pilihan Ganda</option>
                            <option value="essay">Essay</option>
                        </select>
                    </div>

                    {/* Bobot */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bobot <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="bobot"
                            value={formData.bobot}
                            onChange={handleChange}
                            min="1"
                            max="32767"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="10"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Range: 1-32767</p>
                    </div>

                    {/* Opsi Pilihan Ganda */}
                    {formData.tipe_soal === "pilihan_ganda" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Opsi Jawaban
                            </label>
                            <div className="space-y-3">
                                {["A", "B", "C", "D", "E"].map((label) => (
                                    <div key={label} className="flex gap-2 items-center">
                                        <label className="w-12 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {label}.
                                        </label>
                                        <input
                                            type="text"
                                            value={formData[`opsi_${label.toLowerCase()}` as keyof FormData]}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    [`opsi_${label.toLowerCase()}`]: e.target.value,
                                                }))
                                            }
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder={`Opsi ${label}`}
                                        />
                                        <input
                                            type="radio"
                                            name="kunci_jawaban"
                                            value={label}
                                            checked={formData.kunci_jawaban === label}
                                            onChange={handleChange}
                                            className="w-5 h-5 cursor-pointer"
                                            title="Pilih sebagai jawaban benar"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info Essay */}
                    {formData.tipe_soal === "essay" && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                ℹ️ Soal essay akan dikoreksi oleh guru. Siswa akan memasukkan jawaban mereka, dan guru akan memberikan nilai pada halaman penilaian.
                            </p>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition"
                        >
                            {isSaving ? "Menyimpan..." : question ? "Update Soal" : "Tambah Soal"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}