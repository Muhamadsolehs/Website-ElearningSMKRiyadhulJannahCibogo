// --- MOCK SUPABASE CLIENT ---
// Ganti bagian ini dengan import klien Supabase Anda yang sebenarnya
const supabase = {
    storage: {
        from: (bucketName: string) => ({
            upload: async (path: string, file: File, options?: any) => {
                console.log(`[MOCK] Mengunggah file ke bucket: ${bucketName}, path: ${path}`);
                // Simulasi kegagalan 10%
                if (Math.random() < 0.1) {
                    return { data: null, error: { message: "Simulasi kegagalan unggah." } };
                }
                // Simulasi sukses
                await new Promise(resolve => setTimeout(resolve, 1500));
                return {
                    data: {
                        path: path,
                        fullPath: `${bucketName}/${path}`
                    },
                    error: null
                };
            },
            getPublicUrl: (path: string) => {
                return {
                    data: {
                        publicUrl: `https://yourdomain.supabase.co/storage/v1/object/public/${path}`
                    },
                    error: null
                };
            }
        })
    }
};
// --- END MOCK ---

/**
 * Memvalidasi tipe dan ukuran berkas.
 * @param file Berkas yang akan divalidasi.
 * @returns String error jika validasi gagal, null jika sukses.
 */
export const validateFile = (file: File | null): string | null => {
    if (!file) {
        return "Pilih berkas untuk diunggah.";
    }

    const MAX_SIZE_MB = 10;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (file.size > MAX_SIZE_BYTES) {
        return `Ukuran berkas melebihi batas ${MAX_SIZE_MB}MB.`;
    }

    if (!allowedTypes.includes(file.type)) {
        return "Tipe berkas tidak valid. Hanya PDF atau DOCX yang diizinkan.";
    }

    return null;
};

/**
 * Format ukuran berkas ke string yang mudah dibaca (misalnya 1.5 MB).
 * @param bytes Ukuran berkas dalam byte.
 * @returns String ukuran berkas yang diformat.
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Mengunggah berkas ke Supabase Storage.
 * @param file Berkas yang akan diunggah.
 * @param bucketName Nama bucket Supabase.
 * @param path Lokasi berkas di dalam bucket.
 * @returns Public URL berkas atau Error.
 */
export const uploadFileToSupabase = async (
    file: File,
    bucketName: string,
    path: string
): Promise<{ url: string | null, error: string | null }> => {
    try {
        // 1. Unggah Berkas
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false // Jangan menimpa berkas jika sudah ada
            });

        // Perbaikan 1: Memastikan uploadError memiliki properti message (untuk mock)
        if (uploadError) {
            const errorMessage = typeof uploadError === 'object' && uploadError !== null && 'message' in uploadError
                ? uploadError.message
                : "Error unggah tidak diketahui.";

            console.error("Supabase Upload Error:", uploadError);
            return { url: null, error: `Gagal mengunggah berkas: ${errorMessage}` };
        }

        // 2. Ambil Public URL
        // Karena uploadData mungkin null jika error, kita pastikan ada.
        const fullPath = uploadData?.fullPath;
        if (!fullPath) {
            return { url: null, error: "Jalur berkas unggahan tidak tersedia." };
        }

        const { data: urlData, error: urlError } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fullPath);

        // Perbaikan 1: Memastikan urlError memiliki properti message (untuk mock)
        if (urlError) {
            const errorMessage = typeof urlError === 'object' && urlError !== null && 'message' in urlError
                ? urlError.message
                : "Error URL tidak diketahui.";

            console.error("Supabase URL Error:", urlError);
            return { url: null, error: `Gagal mendapatkan URL publik: ${errorMessage}` };
        }

        // Perbaikan 1: Pastikan urlData ada sebelum mengakses publicUrl
        if (!urlData?.publicUrl) {
            return { url: null, error: "URL publik tidak tersedia dari Supabase." };
        }

        return { url: urlData.publicUrl, error: null };

    } catch (e) {
        // Perbaikan 2: Menangani 'e' bertipe 'unknown' dengan instance checking
        let errorMessage = "Terjadi kesalahan tak terduga.";
        if (e instanceof Error) {
            errorMessage = e.message;
        } else if (typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string') {
            errorMessage = e.message;
        }

        console.error("Unexpected Upload Error:", e);
        return { url: null, error: `Terjadi kesalahan tak terduga saat mengunggah: ${errorMessage}` };
    }
};