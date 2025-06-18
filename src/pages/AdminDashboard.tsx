
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Users, Package, FileText, Wrench } from "lucide-react";
import VerifikasiAkun from "@/components/admin/VerifikasiAkun";
import ManajemenAlat from "@/components/admin/ManajemenAlat";
import KonfirmasiPeminjaman from "@/components/admin/KonfirmasiPeminjaman";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    pendingUsers: 0,
    totalAlat: 0,
    pendingPeminjaman: 0
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
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

    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    setUser(session.user);
    setProfile(profile);
  };

  const fetchStats = async () => {
    try {
      // Count pending users
      const { count: pendingUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Count total alat
      const { count: totalAlat } = await supabase
        .from('alat')
        .select('*', { count: 'exact', head: true });

      // Count pending peminjaman
      const { count: pendingPeminjaman } = await supabase
        .from('peminjaman')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        pendingUsers: pendingUsers || 0,
        totalAlat: totalAlat || 0,
        pendingPeminjaman: pendingPeminjaman || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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
                  Dashboard Admin
                </h1>
                <p className="text-sm text-gray-600">Sistem Manajemen Aset Bengkel SMK Elektro</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Akun Pending</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingUsers}</div>
              <p className="text-xs text-muted-foreground">
                Akun siswa menunggu verifikasi
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alat</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlat}</div>
              <p className="text-xs text-muted-foreground">
                Alat yang terdaftar di sistem
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peminjaman Pending</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPeminjaman}</div>
              <p className="text-xs text-muted-foreground">
                Pengajuan menunggu persetujuan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <Tabs defaultValue="verifikasi" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100">
              <TabsTrigger value="verifikasi" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Verifikasi Akun
                {stats.pendingUsers > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {stats.pendingUsers}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="alat" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Manajemen Alat
              </TabsTrigger>
              <TabsTrigger value="peminjaman" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Konfirmasi Peminjaman
                {stats.pendingPeminjaman > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {stats.pendingPeminjaman}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="verifikasi">
              <VerifikasiAkun onStatsUpdate={fetchStats} />
            </TabsContent>

            <TabsContent value="alat">
              <ManajemenAlat onStatsUpdate={fetchStats} />
            </TabsContent>

            <TabsContent value="peminjaman">
              <KonfirmasiPeminjaman onStatsUpdate={fetchStats} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
