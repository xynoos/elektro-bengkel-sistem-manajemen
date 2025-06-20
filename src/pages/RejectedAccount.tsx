
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, Mail } from "lucide-react";

const RejectedAccount = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      setProfile(profileData);

      // Redirect if status changed
      if (profileData.status === 'disetujui') {
        if (profileData.role === 'siswa') {
          navigate('/student-dashboard');
        } else if (profileData.role === 'guru') {
          navigate('/teacher-dashboard');
        }
      } else if (profileData.status === 'pending') {
        navigate('/pending-account');
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-100 rounded-full">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-red-800">
              Akun Ditolak
            </CardTitle>
            <CardDescription className="text-lg">
              Maaf, akun Anda tidak dapat diverifikasi saat ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Detail Akun Anda:</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Nama:</span> {profile.nama_lengkap}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {profile.email}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span> {profile.role === 'siswa' ? 'Siswa' : 'Guru'}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <span className="ml-1 px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs">
                      Ditolak
                    </span>
                  </div>
                </div>
              </div>
            )}

            {profile?.alasan_penolakan && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Alasan Penolakan:
                </h4>
                <p className="text-red-700">{profile.alasan_penolakan}</p>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Langkah Selanjutnya:
              </h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Hubungi admin sekolah untuk klarifikasi lebih lanjut</li>
                <li>• Pastikan data yang Anda berikan sudah benar dan lengkap</li>
                <li>• Anda dapat mendaftar ulang dengan data yang sudah diperbaiki</li>
                <li>• Email admin: admin@smkeletro.ac.id</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  if (profile?.role === 'siswa') {
                    navigate('/student-register');
                  } else {
                    navigate('/teacher-register');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Daftar Ulang
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RejectedAccount;
