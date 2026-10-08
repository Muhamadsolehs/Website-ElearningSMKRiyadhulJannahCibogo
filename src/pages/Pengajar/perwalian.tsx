import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseclient";
import { Printer, Download, Users, Award, ChevronRight } from "lucide-react";
// Impor komponen baru
import ReactDOMServer from "react-dom/server";
import { PrintLaporanNilai } from "./PrintLaporanNilai";

interface Kelas {
    id_kelas: number;
    nama_kelas: string;
}

interface Siswa {
    id_siswa: number;
    nama: string;
    nis: string;
    nilai: NilaiMapel[];
    rata_rata: number;
    // total_poin dihilangkan
}

interface NilaiMapel {
    id_mapel: number;
    nama_mapel: string;
    nilai_akhir: number;
    // total_poin dihilangkan
}

export default function Perwalian() {
    const [kelasList, setKelasList] = useState<Kelas[]>([]);
    const [selectedKelas, setSelectedKelas] = useState<number | null>(null);
    const [siswaList, setSiswaList] = useState<Siswa[]>([]);
    const [mapelList, setMapelList] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [idPengajar, setIdPengajar] = useState<number | null>(null);

    useEffect(() => {
        const storedIdPengajar = localStorage.getItem("id_pengajar");

        if (storedIdPengajar) {
            setIdPengajar(parseInt(storedIdPengajar));
        }
    }, []);

    // Fetch kelas yang diampu pengajar
    useEffect(() => {
        if (!idPengajar) return;

        const fetchKelas = async () => {
            try {
                const { data, error } = await supabase
                    .from("kelas")
                    .select("id_kelas, nama_kelas")
                    .eq("id_pengajar", idPengajar);

                if (error) throw error;

                setKelasList(data || []);

                if (data && data.length > 0) {
                    setSelectedKelas(data[0].id_kelas);
                }
            } catch (error) {
                console.error("❌ Error kelas:", error);
            } finally {
                // Di sini, biarkan loading = true sampai data siswa diambil
            }
        };

        fetchKelas();
    }, [idPengajar]);

    // Fetch siswa dan nilai
    useEffect(() => {
        if (!selectedKelas) return;

        const fetchSiswaAndNilai = async () => {
            setLoading(true);
            try {
                // 1. Ambil semua siswa di kelas dulu
                const { data: siswaData, error: siswaError } = await supabase
                    .from("siswa")
                    .select("id_siswa, nama, nis")
                    .eq("id_kelas", selectedKelas);

                if (siswaError) throw siswaError;
                if (!siswaData || siswaData.length === 0) {
                    setSiswaList([]);
                    setMapelList([]);
                    setLoading(false);
                    return;
                }

                const siswaIds = siswaData.map(s => s.id_siswa);

                // 2. Ambil nilai_akhir untuk siswa-siswa tersebut
                const { data: nilaiData, error: nilaiError } = await supabase
                    .from("nilai_akhir")
                    .select(`
                        id_siswa,
                        id_mapel,
                        nilai_akhir,
                        mata_pelajaran:id_mapel (
                            nama_mapel
                        )
                    `)
                    .in("id_siswa", siswaIds);

                if (nilaiError) throw nilaiError;

                // 3. Group by siswa
                const siswaMap = new Map();
                const mapelSet = new Set<string>();

                siswaData.forEach(siswa => {
                    siswaMap.set(siswa.id_siswa, {
                        id_siswa: siswa.id_siswa,
                        nama: siswa.nama,
                        nis: siswa.nis,
                        nilai: []
                    });
                });

                nilaiData?.forEach(item => {
                    // Cek apakah item.mata_pelajaran valid
                    if (!item.mata_pelajaran || (Array.isArray(item.mata_pelajaran) && item.mata_pelajaran.length === 0)) return;

                    const mataPelajaran = Array.isArray(item.mata_pelajaran)
                        ? item.mata_pelajaran[0]
                        : item.mata_pelajaran;

                    const namaMapel = mataPelajaran.nama_mapel;
                    mapelSet.add(namaMapel);

                    if (siswaMap.has(item.id_siswa)) {
                        siswaMap.get(item.id_siswa).nilai.push({
                            id_mapel: item.id_mapel,
                            nama_mapel: namaMapel,
                            nilai_akhir: item.nilai_akhir,
                            // total_poin dihilangkan
                        });
                    }
                });

                // 4. Hitung rata-rata
                const siswaWithNilai: Siswa[] = Array.from(siswaMap.values()).map((siswa: any) => {
                    const totalNilai = siswa.nilai.reduce((sum: number, n: any) => sum + n.nilai_akhir, 0);
                    const rata_rata = siswa.nilai.length > 0 ? totalNilai / siswa.nilai.length : 0;
                    // total_poin dihilangkan

                    return {
                        ...siswa,
                        rata_rata: Math.round(rata_rata * 100) / 100,
                        // total_poin dihilangkan
                    };
                });

                setMapelList(Array.from(mapelSet));
                setSiswaList(siswaWithNilai);
            } catch (error) {
                console.error("❌ Error:", error);
                alert("Gagal memuat data");
            } finally {
                setLoading(false);
            }
        };

        fetchSiswaAndNilai();
    }, [selectedKelas]);

    // Fungsi print yang baru: render ke jendela baru
    const handlePrint = () => {
        if (siswaList.length === 0 || !selectedKelas) return;

        const namaKelas = kelasList.find(k => k.id_kelas === selectedKelas)?.nama_kelas || "Kelas";

        // Render komponen PrintLaporanNilai ke string HTML
        const printContent = ReactDOMServer.renderToString(
            <PrintLaporanNilai
                siswaList={siswaList}
                mapelList={mapelList}
                namaKelas={namaKelas}
            />
        );

        // Buka jendela baru dan tulis konten cetak
        const printWindow = window.open("", "PrintWindow", "height=800,width=1200");
        if (printWindow) {
            printWindow.document.write("<html><head><title>Laporan Nilai Siswa</title>");
            // Tambahkan CSS khusus untuk cetak di jendela baru jika diperlukan
            printWindow.document.write('<style>');
            printWindow.document.write('@page { size: landscape; margin: 1cm; }');
            printWindow.document.write('body { font-family: Arial, sans-serif; }');
            printWindow.document.write('table { width: 100%; border-collapse: collapse; font-size: 10px; }');
            printWindow.document.write('th, td { border: 1px solid #000; padding: 4px; }');
            printWindow.document.write('th { background-color: #f0f0f0; }');
            printWindow.document.write('</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent);
            printWindow.document.write("</body></html>");
            printWindow.document.close();
            printWindow.print();
        } else {
            alert("Gagal membuka jendela cetak. Pastikan pop-up diizinkan.");
        }
    };


    const exportToCSV = () => {
        const namaKelas = kelasList.find(k => k.id_kelas === selectedKelas)?.nama_kelas || "Kelas";

        // Menghilangkan "Total Poin"
        let csv = `LAPORAN NILAI AKHIR - ${namaKelas}\n\n`;
        csv += `No,NIS,Nama Siswa,${mapelList.join(",")},Rata-rata\n`;

        siswaList.forEach((siswa, idx) => {
            const nilaiPerMapel = mapelList.map(namaMapel => {
                const nilai = siswa.nilai.find(n => n.nama_mapel === namaMapel);
                return nilai ? nilai.nilai_akhir : "-";
            });

            // Menghilangkan total_poin dari baris data
            csv += `${idx + 1},${siswa.nis},${siswa.nama},${nilaiPerMapel.join(",")},${siswa.rata_rata}\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Nilai_${namaKelas}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    if (loading && kelasList.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (!idPengajar) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-2xl mx-auto mt-12">
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                        <p className="text-yellow-800 font-medium">
                            ⚠️ ID Pengajar tidak ditemukan. Pastikan sudah login.
                        </p>
                        <p className="text-sm text-yellow-600 mt-2">
                            Atau ubah manual <code className="bg-yellow-100 px-2 py-1 rounded">idPengajar</code> di kode untuk demo.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (kelasList.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                        <span>Dashboard</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Perwalian</span>
                    </div>

                    <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center shadow-sm">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Tidak Ada Kelas Perwalian
                        </h2>
                        <p className="text-gray-600">
                            Anda belum ditugaskan sebagai wali kelas.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const selectedKelasData = kelasList.find(k => k.id_kelas === selectedKelas);
    const rataRataKelas = siswaList.length > 0
        ? (siswaList.reduce((sum, s) => sum + s.rata_rata, 0) / siswaList.length).toFixed(2)
        : "0";

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-6 print:hidden">
                    <span>Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium">Perwalian</span>
                </div>

                {/* Header dengan Dropdown Kelas */}
                <div className="mb-6 print:hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                📊 Perwalian - Nilai Siswa
                            </h1>
                            <p className="text-gray-600">
                                Rekap nilai akhir siswa per mata pelajaran
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={selectedKelas || ""}
                                onChange={(e) => setSelectedKelas(parseInt(e.target.value))}
                                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                            >
                                {kelasList.map((kelas) => (
                                    <option key={kelas.id_kelas} value={kelas.id_kelas}>
                                        {kelas.nama_kelas}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={exportToCSV}
                                disabled={siswaList.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition shadow-sm"
                            >
                                <Download className="w-5 h-5" />
                                CSV
                            </button>

                            <button
                                onClick={handlePrint}
                                disabled={siswaList.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition shadow-sm"
                            >
                                <Printer className="w-5 h-5" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistik Kelas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center gap-3">
                            <Users className="w-12 h-12 opacity-80" />
                            <div>
                                <p className="text-sm opacity-90 font-medium">Total Siswa</p>
                                <p className="text-4xl font-bold">{siswaList.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center gap-3">
                            <Award className="w-12 h-12 opacity-80" />
                            <div>
                                <p className="text-sm opacity-90 font-medium">Rata-rata Kelas</p>
                                <p className="text-4xl font-bold">
                                    {rataRataKelas}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="flex items-center gap-3">
                            <Award className="w-12 h-12 opacity-80" />
                            <div>
                                <p className="text-sm opacity-90 font-medium">Mata Pelajaran</p>
                                <p className="text-4xl font-bold">{mapelList.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabel Nilai Tampilan Web */}
                <div className="print:hidden">
                    {loading ? (
                        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center shadow-sm">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Memuat data nilai...</p>
                        </div>
                    ) : siswaList.length === 0 ? (
                        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center shadow-sm">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">
                                Belum ada siswa di kelas ini
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                                        <tr>
                                            <th className="px-4 py-4 text-left font-bold text-gray-900">
                                                No
                                            </th>
                                            <th className="px-4 py-4 text-left font-bold text-gray-900">
                                                NIS
                                            </th>
                                            <th className="px-4 py-4 text-left font-bold text-gray-900 whitespace-nowrap">
                                                Nama Siswa
                                            </th>
                                            {mapelList.map((mapel, idx) => (
                                                <th
                                                    key={idx}
                                                    className="px-4 py-4 text-center font-bold text-gray-900 whitespace-nowrap"
                                                >
                                                    {mapel}
                                                </th>
                                            ))}
                                            <th className="px-4 py-4 text-center font-bold bg-blue-100 text-blue-900 whitespace-nowrap">
                                                Rata-rata
                                            </th>
                                            {/* Kolom Total Poin dihilangkan dari tampilan web */}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {siswaList.map((siswa, idx) => (
                                            <tr
                                                key={siswa.id_siswa}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-4 py-3 text-gray-900">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3 text-gray-900 font-medium">
                                                    {siswa.nis}
                                                </td>
                                                <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                                                    {siswa.nama}
                                                </td>
                                                {mapelList.map((namaMapel, mapelIdx) => {
                                                    const nilai = siswa.nilai.find(
                                                        (n) => n.nama_mapel === namaMapel
                                                    );
                                                    return (
                                                        <td
                                                            key={mapelIdx}
                                                            className="px-4 py-3 text-center text-gray-900"
                                                        >
                                                            {nilai ? (
                                                                <span
                                                                    className={`font-bold ${nilai.nilai_akhir >= 75
                                                                        ? "text-green-600"
                                                                        : "text-red-600"
                                                                        }`}
                                                                >
                                                                    {nilai.nilai_akhir}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-3 text-center font-bold text-blue-700 bg-blue-50">
                                                    {siswa.rata_rata}
                                                </td>
                                                {/* Kolom Total Poin dihilangkan dari baris data */}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Hapus tag <style> lama karena fungsi cetak baru menggunakan komponen PrintLaporanNilai di jendela terpisah */}
        </div>
    );
}