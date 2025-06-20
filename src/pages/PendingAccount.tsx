
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ArrowLeft, RefreshCw } from "lucide-react";

const PendingAccount = () => {
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
      } else if (profileData.status === 'ditolak') {
        navigate('/rejected-account');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-yellow-100 rounded-full">
                <Clock className="h-12 w-12 text-yellow-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-800">
              Akun Menunggu Verifikasi
            </CardTitle>
            <CardDescription className="text-lg">
              Akun Anda sedang dalam proses verifikasi oleh admin
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
                    <span className="ml-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs">
                      Menunggu Verifikasi
                    </span>
                  </div>
                  {profile.role === 'siswa' && (
                    <>
                      <div>
                        <span className="font-medium">Kelas:</span> {profile.kelas}
                      </div>
                      <div>
                        <span className="font-medium">Jurusan:</span> {profile.jurusan}
                      </div>
                      <div>
                        <span className="font-medium">NIS:</span> {profile.nis}
                      </div>
                    </>
                  )}
                  {profile.role === 'guru' && (
                    <>
                      <div>
                        <span className="font-medium">Mata Pelajaran:</span> {profile.mata_pelajaran}
                      </div>
                      <div>
                        <span className="font-medium">NIP:</span> {profile.nip}
                      </div>
                    </>
                  )}
                  <div>
                    <span className="font-medium">Tanggal Daftar:</span> {new Date(profile.tanggal_daftar).toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Informasi:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Admin akan meninjau akun Anda dalam 1-2 hari kerja</li>
                <li>• Anda akan menerima email notifikasi setelah verifikasi selesai</li>
                <li>• Pastikan data yang Anda berikan sudah benar dan lengkap</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={checkUserStatus}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Status
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingAccount;
