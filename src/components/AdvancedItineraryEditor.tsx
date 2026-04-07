import React, { useState, useEffect } from 'react';
import { useTrips } from '@/hooks/useTrips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Plus, Trash2, Edit2, Clock, MapPin, DollarSign } from 'lucide-react';
import type { ItineraryLeg } from '@/types/itinerary';
import { toast } from 'sonner';

interface AdvancedItineraryEditorProps {
  tripId: string;
}

export const AdvancedItineraryEditor: React.FC<AdvancedItineraryEditorProps> = ({ tripId }) => {
  const { addLeg, updateLeg, deleteLeg } = useTrips();
  const [legs, setLegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedLeg, setDraggedLeg] = useState<string | null>(null);
  const [editingLeg, setEditingLeg] = useState<any | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<ItineraryLeg>>({
    type: 'activity',
    cost: 0,
  });

  const handleAddLeg = async () => {
    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }

    setLoading(true);
    try {
      const result = await addLeg(tripId, formData);
      if (result) {
        setLegs((prev) => [...prev, result]);
        toast.success('Activity added successfully!');
        setFormData({ type: 'activity', cost: 0 });
        setShowDialog(false);
      }
    } catch (error) {
      toast.error('Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLeg = async () => {
    if (!editingLeg) return;

    setLoading(true);
    try {
      const result = await updateLeg(editingLeg.id, formData);
      if (result) {
        setLegs((prev) => prev.map((l) => (l.id === editingLeg.id ? result : l)));
        toast.success('Activity updated successfully!');
        setEditingLeg(null);
        setFormData({ type: 'activity', cost: 0 });
        setShowDialog(false);
      }
    } catch (error) {
      toast.error('Failed to update activity');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeg = async (legId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    setLoading(true);
    try {
      const success = await deleteLeg(legId);
      if (success) {
        setLegs((prev) => prev.filter((l) => l.id !== legId));
        toast.success('Activity deleted successfully!');
      }
    } catch (error) {
      toast.error('Failed to delete activity');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (legId: string) => {
    setDraggedLeg(legId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetLegId: string) => {
    if (!draggedLeg || draggedLeg === targetLegId) return;

    const draggedIndex = legs.findIndex((l) => l.id === draggedLeg);
    const targetIndex = legs.findIndex((l) => l.id === targetLegId);

    const newLegs = [...legs];
    [newLegs[draggedIndex], newLegs[targetIndex]] = [newLegs[targetIndex], newLegs[draggedIndex]];

    setLegs(newLegs);
    setDraggedLeg(null);
    toast.success('Activity reordered');
  };

  const openEditDialog = (leg: any) => {
    setEditingLeg(leg);
    setFormData({
      type: leg.type,
      title: leg.title,
      description: leg.description,
      from: leg.from_location,
      to: leg.to_location,
      cost: leg.cost,
      day: leg.day_number,
    });
    setShowDialog(true);
  };

  const typeColors: Record<string, string> = {
    transport: 'bg-blue-100 text-blue-800',
    hotel: 'bg-purple-100 text-purple-800',
    activity: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Itinerary</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingLeg(null);
                setFormData({ type: 'activity', cost: 0 });
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLeg ? 'Edit Activity' : 'Add New Activity'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Activity name"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Add details about this activity..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Location</label>
                  <Input
                    placeholder="Location"
                    value={formData.from || ''}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Location</label>
                  <Input
                    placeholder="Destination"
                    value={formData.to || ''}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  />
                </div>
              </div>

              {/* Day & Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Day</label>
                  <Input
                    type="number"
                    placeholder="Day number"
                    value={formData.day || ''}
                    onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cost ($)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.cost || ''}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={editingLeg ? handleUpdateLeg : handleAddLeg}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Saving...' : editingLeg ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Legs List */}
      <div className="space-y-3">
        {legs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              No activities yet. Click "Add Activity" to get started!
            </CardContent>
          </Card>
        ) : (
          legs.map((leg, index) => (
            <Card
              key={leg.id}
              draggable
              onDragStart={() => handleDragStart(leg.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(leg.id)}
              className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />

                  {/* Day Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold">
                      {leg.day_number || index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              typeColors[leg.type] || 'bg-gray-100'
                            }`}
                          >
                            {leg.type.charAt(0).toUpperCase() + leg.type.slice(1)}
                          </span>
                          <h3 className="text-lg font-semibold">{leg.title}</h3>
                        </div>

                        {leg.description && <p className="text-sm text-gray-600 mb-2">{leg.description}</p>}

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          {leg.from_location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {leg.from_location}
                            </div>
                          )}
                          {leg.cost > 0 && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              ${leg.cost.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(leg)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLeg(leg.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
