import React, { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun, Globe, Bell, Mail, Save } from 'lucide-react';
import { toast } from 'sonner';

export const UserSettings: React.FC = () => {
  const { profile, updateProfile, updateTheme, updateNotificationPreferences } = useProfile();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailOnShare, setEmailOnShare] = useState(true);
  const [emailOnMention, setEmailOnMention] = useState(true);
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setCurrency(profile.currency);
      setLanguage(profile.language);
      setNotificationsEnabled(profile.notifications_enabled);
      setEmailOnShare(profile.email_on_share);
      setEmailOnMention(profile.email_on_mention);
      setThemeState(profile.theme);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        bio: bio,
        currency: currency,
        language: language,
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    try {
      await updateTheme(newTheme);
      toast.success(`Theme changed to ${newTheme}`);
    } catch (error) {
      toast.error('Failed to update theme');
    }
  };

  const handleNotificationPreferencesChange = async (
    enabled: boolean,
    share: boolean,
    mention: boolean
  ) => {
    setNotificationsEnabled(enabled);
    setEmailOnShare(share);
    setEmailOnMention(mention);
    try {
      await updateNotificationPreferences(enabled, share, mention);
      toast.success('Notification preferences updated!');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email (Read-only) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  value={profile?.email || ''}
                  readOnly
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </label>
                <textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  rows={4}
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full earth-gradient"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your app experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Theme</h3>
                <div className="flex gap-4">
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('dark')}
                    className="flex items-center gap-2"
                  >
                    <Moon className="w-4 h-4" />
                    Dark Mode
                  </Button>
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('light')}
                    className="flex items-center gap-2"
                  >
                    <Sun className="w-4 h-4" />
                    Light Mode
                  </Button>
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                  <option value="INR">₹ INR</option>
                  <option value="JPY">¥ JPY</option>
                  <option value="CAD">C$ CAD</option>
                  <option value="AUD">A$ AUD</option>
                  <option value="SGD">S$ SGD</option>
                </select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <label htmlFor="language" className="text-sm font-medium">
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Control how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium">Enable Notifications</span>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={(checked) =>
                    handleNotificationPreferencesChange(
                      checked,
                      checked ? emailOnShare : false,
                      checked ? emailOnMention : false
                    )
                  }
                />
              </div>

              {/* Email on share */}
              {notificationsEnabled && (
                <>
                  <div className="flex items-center justify-between pl-6">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email when trip is shared with me</span>
                    </div>
                    <Switch
                      checked={emailOnShare}
                      onCheckedChange={(checked) =>
                        handleNotificationPreferencesChange(
                          notificationsEnabled,
                          checked,
                          emailOnMention
                        )
                      }
                    />
                  </div>

                  {/* Email on mention */}
                  <div className="flex items-center justify-between pl-6">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email when someone mentions me</span>
                    </div>
                    <Switch
                      checked={emailOnMention}
                      onCheckedChange={(checked) =>
                        handleNotificationPreferencesChange(
                          notificationsEnabled,
                          emailOnShare,
                          checked
                        )
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
