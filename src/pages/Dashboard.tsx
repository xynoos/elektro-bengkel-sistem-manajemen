
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Package, Clock, CheckCircle, XCircle, Wrench } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [alat, setAlat] = useState<any[]>([]);
  const [peminjaman, setPeminjaman] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'umum' || profile?.status !== 'disetujui') {
      navigate('/');
      return;
    }

    setUser(session.user);
    setProfile(profile);
  };

  const fetchData = async () => {
    try {
      // Fetch available tools
      const { data: alatData, error: alatError } = await supabase
        .from('alat')
        .select('*')
        .order('nama');

      if (alatError) throw alatError;
      setAlat(alatData || []);

      // Fetch user's borrowing history
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: peminjamanData, error: peminjamanError } = await supabase
          .from('peminjaman')
          .select(`
            *,
            alat:alat_id (nama)
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (peminjamanError) throw peminjamanError;
        setPeminjaman(peminjamanData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Menunggu", icon: Clock },
      disetujui: { variant: "default" as const, label: "Disetujui", icon: CheckCircle },
      ditolak: { variant: "destructive" as const, label: "Ditolak", icon: XCircle },
      selesai: { variant: "outline" as const, label: "Selesai", icon: CheckCircle }
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

  const getStokBadge = (status: string) => {
    const statusConfig = {
      aman: { variant: "default" as const, label: "Tersedia" },
      hampir_habis: { variant: "secondary" as const, label: "Terbatas" },
      kosong: { variant: "destructive" as const, label: "Kosong" },
      pending_pengadaan: { variant: "outline" as const, label: "Pengadaan" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? (
      <Badge variant={config.variant}>{config.label}</Badge>
    ) : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Dashboard Siswa
                </h1>
                <p className="text-sm text-gray-600">Selamat datang, {profile?.nama_lengkap}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => navigate('/pinjam')}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <Package className="mr-2 h-4 w-4" />
                Pinjam Alat
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Available Tools */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Alat Tersedia
              </CardTitle>
              <CardDescription>
                Daftar alat dan barang yang tersedia di bengkel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alat.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.nama}</h4>
                      <p className="text-sm text-gray-600">Stok: {item.jumlah} • {item.kondisi}</p>
                      {item.deskripsi && (
                        <p className="text-xs text-gray-500 mt-1">{item.deskripsi}</p>
                      )}
                    </div>
                    {getStokBadge(item.status_stok)}
                  </div>
                ))}
                {alat.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Belum ada alat yang tersedia</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Borrowing History */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Riwayat Peminjaman
              </CardTitle>
              <CardDescription>
                Status peminjaman alat Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {peminjaman.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{item.alat?.nama}</h4>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Jumlah: {item.jumlah}</p>
                      <p>Keperluan: {item.keperluan}</p>
                      <p>Tanggal: {new Date(item.tanggal_pinjam).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                ))}
                {peminjaman.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Belum ada riwayat peminjaman</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
