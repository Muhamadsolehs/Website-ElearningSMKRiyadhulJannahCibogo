import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabaseclient";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData?.session?.user;

            if (!user) {
                alert("Autentikasi gagal. Silakan login ulang.");
                navigate("/signin");
                return;
            }

            // Cek apakah email user terdaftar di tabel admin
            const { data: admin, error } = await supabase
                .from("admin")
                .select("*")
                .eq("email", user.email)
                .single();

            if (error || !admin) {
                alert("Akses Google hanya untuk admin terdaftar!");
                await supabase.auth.signOut();
                navigate("/signin");
                return;
            }

            // Simpan data admin
            localStorage.setItem("user_role", "admin");
            localStorage.setItem("username", admin.username);
            localStorage.setItem("id_user", admin.id_admin.toString());
            localStorage.setItem("nama", admin.nama);

            console.log("✅ Login SSO berhasil sebagai Admin");
            navigate("/Admin/Home");
        };

        checkAdmin();
    }, [navigate]);

    return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-gray-600 dark:text-gray-300">Processing login...</p>
        </div>
    );
}
