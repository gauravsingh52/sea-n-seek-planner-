import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { UserSettings } from '@/components/UserSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Menu } from 'lucide-react';
import { WaveLoader } from '@/components/WaveLoader';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      toast.success('You have been logged out');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const loading = profileLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <WaveLoader />
      </div>
    );
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent hover:from-emerald-300 hover:to-cyan-300 transition-colors"
              >
                🌍 SeaNSeek
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-gray-300 hover:text-white"
            >
              ← Back
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8 bg-white/5 border-white/10">
          <CardContent className="pt-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-6">
                <Avatar className="w-24 h-24 border-2 border-emerald-400">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-900 text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold mb-1">
                    {profile?.full_name || 'Welcome!'}
                  </h1>
                  <p className="text-gray-400 mb-2">{user?.email}</p>
                  {profile?.bio && <p className="text-gray-300 max-w-md">{profile.bio}</p>}
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10">
              <div>
                <p className="text-sm text-gray-400">Currency</p>
                <p className="text-lg font-semibold">{profile?.currency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Language</p>
                <p className="text-lg font-semibold capitalize">{profile?.language}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Theme</p>
                <p className="text-lg font-semibold capitalize">{profile?.theme} Mode</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Member Since</p>
                <p className="text-lg font-semibold">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                      })
                    : 'Today'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Menu className="w-6 h-6" />
            Settings
          </h2>
          <UserSettings />
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-gray-400">
          <p>
            Need help? Check out our{' '}
            <a href="/help" className="text-emerald-400 hover:text-emerald-300">
              FAQ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
