import React, { useState } from 'react';
import { useTrips } from '@/hooks/useTrips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Mail, Link as LinkIcon, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TripSharingProps {
  tripId: string;
}

export const TripSharing: React.FC<TripSharingProps> = ({ tripId }) => {
  const { shareTrip, addCollaborator } = useTrips();
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState<'viewer' | 'editor'>('viewer');

  const handleShareTrip = async () => {
    setLoading(true);
    try {
      const code = await shareTrip(tripId);
      if (code) {
        setShareCode(code);
        toast.success('Trip is now shareable!');
      }
    } catch (error) {
      toast.error('Failed to generate share code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareCode) return;
    const link = `${window.location.origin}/trip/${shareCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCollaborator = async () => {
    if (!collabEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const success = await addCollaborator(tripId, collabEmail, collabRole);
      if (success) {
        toast.success(`Invitation sent to ${collabEmail}`);
        setCollabEmail('');
        setCollabRole('viewer');
      }
    } catch (error) {
      toast.error('Failed to invite collaborator');
    } finally {
      setLoading(false);
    }
  };

  const shareLink = shareCode ? `${window.location.origin}/trip/${shareCode}` : '';

  return (
    <div className="space-y-4">
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Trip
          </CardTitle>
          <CardDescription>Invite others to view or edit your itinerary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Share Code Section */}
          {shareCode ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">Share Link</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 bg-gray-50"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Share Code</p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {shareCode}
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                ✓ Trip is now public. Anyone with the link can view it.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleShareTrip}
              disabled={loading}
              className="w-full earth-gradient"
            >
              {loading ? 'Generating...' : 'Generate Share Link'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Invite Collaborators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite Collaborators
          </CardTitle>
          <CardDescription>Add team members to collaborate on this trip</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Invite by Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Collaborator</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="collaborator@example.com"
                    value={collabEmail}
                    onChange={(e) => setCollabEmail(e.target.value)}
                  />
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={collabRole} onValueChange={(val: any) => setCollabRole(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                      <SelectItem value="editor">Editor (can modify)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {collabRole === 'viewer'
                      ? 'Viewers can see the itinerary but cannot make changes.'
                      : 'Editors can view and modify the itinerary.'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddCollaborator}
                    disabled={loading}
                    className="flex-1 earth-gradient"
                  >
                    {loading ? 'Sending...' : 'Send Invite'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Collaborators will receive an email invitation and must accept to join the trip.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Collaboration Roles Legend */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Collaboration Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-3">
            <Badge>Owner</Badge>
            <span className="text-gray-600">Full access, can manage collaborators</span>
          </div>
          <div className="flex gap-3">
            <Badge variant="secondary">Editor</Badge>
            <span className="text-gray-600">Can view and modify the itinerary</span>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline">Viewer</Badge>
            <span className="text-gray-600">Can only view, cannot make changes</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
