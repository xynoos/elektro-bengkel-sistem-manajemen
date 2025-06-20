
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, User } from "lucide-react";

interface VerifikasiAkunProps {
  onStatsUpdate: () => void;
}

const VerifikasiAkun = ({ onStatsUpdate }: VerifikasiAkunProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['siswa', 'guru'])
        .order('tanggal_daftar', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (userId: string, status: 'disetujui' | 'ditolak', reason?: string) => {
    try {
      const updateData: any = { status };
      if (status === 'ditolak' && reason) {
        updateData.alasan_penolakan = reason;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: status === 'disetujui' ? "Akun Disetujui" : "Akun Ditolak",
        description: `Akun pengguna telah ${status === 'disetujui' ? 'disetujui' : 'ditolak'}.`,
      });

      fetchUsers();
      onStatsUpdate();
      setRejectionReason("");
      setSelectedUserId("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Menunggu", icon: Clock },
      disetujui: { variant: "default" as const, label: "Disetujui", icon: Check },
      ditolak: { variant: "destructive" as const, label: "Ditolak", icon: X }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Verifikasi Akun Siswa & Guru
        </CardTitle>
        <CardDescription>
          Kelola persetujuan akun siswa dan guru yang mendaftar di sistem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{user.nama_lengkap}</h4>
                      {getStatusBadge(user.status)}
                      <Badge variant="outline" className="text-xs">
                        {user.role === 'siswa' ? 'Siswa' : 'Guru'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Email:</strong> {user.email}</p>
                        {user.role === 'siswa' && (
                          <>
                            <p><strong>Umur:</strong> {user.umur} tahun</p>
                            <p><strong>Kelas:</strong> {user.kelas}</p>
                            <p><strong>Jurusan:</strong> {user.jurusan}</p>
                            <p><strong>NIS:</strong> {user.nis}</p>
                          </>
                        )}
                        {user.role === 'guru' && (
                          <>
                            <p><strong>Mata Pelajaran:</strong> {user.mata_pelajaran}</p>
                            <p><strong>NIP:</strong> {user.nip}</p>
                          </>
                        )}
                      </div>
                      <div>
                        <p><strong>Tanggal Daftar:</strong> {new Date(user.tanggal_daftar).toLocaleDateString('id-ID')}</p>
                        {user.alasan_penolakan && (
                          <div className="mt-2">
                            <p><strong>Alasan Penolakan:</strong></p>
                            <p className="text-red-600 text-xs bg-red-50 p-2 rounded">{user.alasan_penolakan}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {user.status === 'pending' && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleVerification(user.id, 'disetujui')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Setujui
                      </Button>
                      {selectedUserId === user.id ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Alasan penolakan..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="text-xs"
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleVerification(user.id, 'ditolak', rejectionReason)}
                              disabled={!rejectionReason.trim()}
                            >
                              Tolak
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUserId("");
                                setRejectionReason("");
                              }}
                            >
                              Batal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Belum ada akun yang terdaftar
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
};

export default VerifikasiAkun;
