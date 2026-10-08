// pages/Quiz/QuizResultPreview.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseclient";
import { ArrowLeft, User, ChevronRight } from "lucide-react";

interface Attempt {
    id_hasil: number;
    id_siswa: number;
    total_nilai: number;
    benar: number;
    salah: number;
    total_soal: number;
    created_at: string;
    siswa: {
        nama: string;
    };
}

export default function QuizResultPreview() {
    const { id_kuis } = useParams<{ id_kuis: string }>(); // Dapatkan id_kuis
    const navigate = useNavigate();
    // Menambahkan tipe data untuk useState agar lebih akurat di TypeScript
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        // Pastikan id_kuis ada sebelum memanggil Supabase
        if (!id_kuis) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from("hasil_kuis")
            .select("*, siswa(nama)")
            .eq("id_kuis", id_kuis)
            .order("created_at", { ascending: false });

        if (!error) {
            setAttempts(data as Attempt[]);
        } else {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [id_kuis]); // Tambahkan id_kuis sebagai dependency

    return (
        <div className="container mx-auto p-4 md:p-8">
            {/* PERBAIKAN: Menggunakan jalur absolut
                Tombol ini sekarang SELALU mengarahkan ke /Pengajar/QuizPreview/{id_kuis}
            */}
            <div
                onClick={() => navigate(`/Pengajar/QuizPreview/${id_kuis}`)}
                className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-700 cursor-pointer"
            >
                <ArrowLeft className="w-5 h-5" />
                Kembali
            </div>

            <h1 className="text-2xl font-bold mb-6 dark:text-white">
                Daftar Siswa yang Mengerjakan Kuis
            </h1>

            {loading ? (
                <p className="dark:text-white">Memuat...</p>
            ) : attempts.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                    Belum ada siswa yang mengerjakan
                </p>
            ) : (
                <div className="space-y-4">
                    {attempts.map((item) => (
                        <div
                            key={item.id_hasil}
                            onClick={() =>
                                navigate(`/pengajar/quiz-result-detail/${id_kuis}/${item.id_siswa}`)
                            }
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-between items-center hover:shadow-md cursor-pointer transition"
                        >
                            <div className="flex items-center gap-4">
                                <User className="w-6 h-6 text-blue-500" />
                                <div>
                                    <p className="font-semibold dark:text-white">
                                        {item.siswa?.nama || "Tidak diketahui"}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Nilai: {item.total_nilai} • Benar: {item.benar} • Salah:{" "}
                                        {item.salah}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        Dikerjakan:{" "}
                                        {new Date(item.created_at).toLocaleString("id-ID")}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}