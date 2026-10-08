// PrintLaporanNilai.tsx
import React from "react";

// Definisikan ulang interface yang dibutuhkan
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

interface PrintLaporanNilaiProps {
    siswaList: Siswa[];
    mapelList: string[];
    namaKelas: string;
}

export const PrintLaporanNilai: React.FC<PrintLaporanNilaiProps> = ({
    siswaList,
    mapelList,
    namaKelas,
}) => {
    // Menghitung rata-rata kelas (tetap ada di statistik)
    const rataRataKelas = siswaList.length > 0
        ? (siswaList.reduce((sum, s) => sum + s.rata_rata, 0) / siswaList.length).toFixed(2)
        : "0";

    const WaliKelasSignature = "Wali Kelas"; // Ganti dengan nama Wali Kelas jika ada
    const KepalaSekolahSignature = "Kepala Sekolah"; // Ganti dengan nama Kepala Sekolah jika ada

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            {/* Header Cetak */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "20px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: "0" }}>
                    LAPORAN NILAI AKHIR SISWA
                </h1>
                <p style={{ fontSize: "16px", fontWeight: "600", margin: "5px 0 0 0" }}>
                    Kelas: {namaKelas}
                </p>
                <p style={{ fontSize: "12px", color: "#555", margin: "5px 0 0 0" }}>
                    Dicetak pada: {new Date().toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    })}
                </p>
            </div>

            {/* Statistik Ringkas */}
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "20px", border: "1px solid #ddd", padding: "10px", borderRadius: "5px" }}>
                <div>
                    <p style={{ margin: "0", fontSize: "12px" }}>Total Siswa</p>
                    <p style={{ margin: "0", fontSize: "24px", fontWeight: "bold" }}>{siswaList.length}</p>
                </div>
                <div>
                    <p style={{ margin: "0", fontSize: "12px" }}>Rata-rata Kelas</p>
                    <p style={{ margin: "0", fontSize: "24px", fontWeight: "bold" }}>{rataRataKelas}</p>
                </div>
                <div>
                    <p style={{ margin: "0", fontSize: "12px" }}>Mata Pelajaran</p>
                    <p style={{ margin: "0", fontSize: "24px", fontWeight: "bold" }}>{mapelList.length}</p>
                </div>
            </div>

            {/* Tabel Nilai */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                <thead>
                    <tr style={{ backgroundColor: "#f0f0f0", borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
                        <th style={{ padding: "8px 4px", textAlign: "left", border: "1px solid #000" }}>No</th>
                        <th style={{ padding: "8px 4px", textAlign: "left", border: "1px solid #000" }}>NIS</th>
                        <th style={{ padding: "8px 4px", textAlign: "left", whiteSpace: "nowrap", border: "1px solid #000" }}>Nama Siswa</th>
                        {mapelList.map((mapel, idx) => (
                            <th key={idx} style={{ padding: "8px 4px", textAlign: "center", whiteSpace: "nowrap", border: "1px solid #000" }}>
                                {mapel}
                            </th>
                        ))}
                        <th style={{ padding: "8px 4px", textAlign: "center", whiteSpace: "nowrap", backgroundColor: "#e0f7fa", border: "1px solid #000" }}>
                            Rata-rata
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {siswaList.map((siswa, idx) => (
                        <tr key={siswa.id_siswa} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "8px 4px", border: "1px solid #000" }}>{idx + 1}</td>
                            <td style={{ padding: "8px 4px", border: "1px solid #000" }}>{siswa.nis}</td>
                            <td style={{ padding: "8px 4px", whiteSpace: "nowrap", border: "1px solid #000" }}>{siswa.nama}</td>
                            {mapelList.map((namaMapel, mapelIdx) => {
                                const nilai = siswa.nilai.find((n) => n.nama_mapel === namaMapel);
                                return (
                                    <td key={mapelIdx} style={{ padding: "8px 4px", textAlign: "center", border: "1px solid #000" }}>
                                        <span style={{ fontWeight: "bold", color: nilai && nilai.nilai_akhir >= 75 ? "#000" : "#000" }}>
                                            {nilai ? nilai.nilai_akhir : "-"}
                                        </span>
                                    </td>
                                );
                            })}
                            <td style={{ padding: "8px 4px", textAlign: "center", fontWeight: "bold", backgroundColor: "#f1f8e9", border: "1px solid #000" }}>
                                {siswa.rata_rata}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer Tanda Tangan */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "50px", fontSize: "12px" }}>
                <div style={{ width: "200px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 80px 0" }}>{WaliKelasSignature}</p>
                    <p style={{ margin: "0", borderTop: "1px solid #000", paddingTop: "5px" }}>
                        (................................)
                    </p>
                </div>
                <div style={{ width: "200px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 80px 0" }}>{KepalaSekolahSignature}</p>
                    <p style={{ margin: "0", borderTop: "1px solid #000", paddingTop: "5px" }}>
                        (................................)
                    </p>
                </div>
            </div>
        </div>
    );
};