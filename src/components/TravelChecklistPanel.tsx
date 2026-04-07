import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Backpack,
  FileText,
  Heart,
  MapPin,
  Plus,
  Trash2,
  Download,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  item_text: string;
  is_completed: boolean;
  category?: string;
}

interface TravelChecklist {
  id: string;
  trip_id: string;
  title: string;
  description?: string;
  category: 'documents' | 'packing' | 'health' | 'planning' | 'custom';
  items: ChecklistItem[];
}

interface TravelChecklistProps {
  tripId: string;
}

const PRESET_CHECKLISTS = {
  documents: {
    title: 'Essential Documents',
    items: [
      'Passport',
      'Visa (if required)',
      'Travel insurance',
      'Flight tickets',
      'Hotel reservations',
      'Car rental confirmation',
      'Travel itinerary',
      'Emergency contacts',
      'Copies of important documents',
    ],
  },
  packing: {
    title: 'Packing Essentials',
    items: [
      'Clothes (appropriate for weather)',
      'Comfortable walking shoes',
      'Sunscreen',
      'Medications',
      'Toiletries',
      'Phone charger',
      'Universal power adapter',
      'Camera',
      'Backpack/luggage',
      'Underwear & socks',
    ],
  },
  health: {
    title: 'Health & Wellness',
    items: [
      'Prescription medications',
      'First aid kit',
      'Travel health insurance',
      'Vaccinations up to date',
      'Allergy medications',
      'Pain relievers',
      'Anti-diarrhea medication',
      'Sleep aid (optional)',
    ],
  },
  planning: {
    title: 'Trip Planning',
    items: [
      'Book accommodations',
      'Book flights',
      'Plan main activities',
      'Research restaurants',
      'Check weather forecast',
      'Notify bank of travel',
      'Arrange transportation',
      'Get travel insurance',
      'Download offline maps',
      'Share itinerary with loved ones',
    ],
  },
};

export const TravelChecklist: React.FC<TravelChecklistProps> = ({ tripId }) => {
  const [checklists, setChecklists] = useState<TravelChecklist[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedChecklists, setExpandedChecklists] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof PRESET_CHECKLISTS>('documents');
  const [customTitle, setCustomTitle] = useState('');

  // Load checklists
  const loadChecklists = async () => {
    try {
      const { data, error: err } = await supabase
        .from('travel_checklists')
        .select('*')
        .eq('trip_id', tripId);

      if (err) throw err;

      // Fetch items for each checklist
      const checklistsWithItems = await Promise.all(
        (data || []).map(async (checklist) => {
          const { data: items, error: itemsErr } = await supabase
            .from('checklist_items')
            .select('*')
            .eq('checklist_id', checklist.id)
            .order('order_index');

          if (itemsErr) throw itemsErr;
          return { ...checklist, items: items || [] };
        })
      );

      setChecklists(checklistsWithItems);
    } catch (error) {
      toast.error('Failed to load checklists');
    }
  };

  useEffect(() => {
    loadChecklists();
  }, [tripId]);

  const addPresetChecklist = async () => {
    const preset = PRESET_CHECKLISTS[selectedCategory];
    try {
      setLoading(true);

      // Create checklist
      const { data: checklistData, error: checklistErr } = await supabase
        .from('travel_checklists')
        .insert([
          {
            trip_id: tripId,
            title: preset.title,
            category: selectedCategory,
          },
        ])
        .select()
        .single();

      if (checklistErr) throw checklistErr;

      // Add items
      const items = preset.items.map((item, index) => ({
        checklist_id: checklistData.id,
        item_text: item,
        order_index: index,
      }));

      const { error: itemsErr } = await supabase.from('checklist_items').insert(items);

      if (itemsErr) throw itemsErr;

      toast.success(`${preset.title} added!`);
      await loadChecklists();
      setShowDialog(false);
    } catch (error) {
      toast.error('Failed to add checklist');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (itemId: string, currentState: boolean) => {
    try {
      const { error: err } = await supabase
        .from('checklist_items')
        .update({ is_completed: !currentState })
        .eq('id', itemId);

      if (err) throw err;
      await loadChecklists();
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const deleteChecklist = async (checklistId: string) => {
    if (!confirm('Delete this checklist?')) return;

    try {
      const { error: err } = await supabase
        .from('travel_checklists')
        .delete()
        .eq('id', checklistId);

      if (err) throw err;
      await loadChecklists();
      toast.success('Checklist deleted');
    } catch (error) {
      toast.error('Failed to delete checklist');
    }
  };

  const toggleChecklistExpand = (checklistId: string) => {
    const newExpanded = new Set(expandedChecklists);
    if (newExpanded.has(checklistId)) {
      newExpanded.delete(checklistId);
    } else {
      newExpanded.add(checklistId);
    }
    setExpandedChecklists(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'documents':
        return <FileText className="w-5 h-5" />;
      case 'packing':
        return <Backpack className="w-5 h-5" />;
      case 'health':
        return <Heart className="w-5 h-5" />;
      case 'planning':
        return <MapPin className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const getProgress = (checklist: TravelChecklist) => {
    if (checklist.items.length === 0) return 0;
    const completed = checklist.items.filter((i) => i.is_completed).length;
    return Math.round((completed / checklist.items.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Travel Checklist</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 earth-gradient">
              <Plus className="w-4 h-4" />
              Add Checklist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Travel Checklist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Category</label>
                <Select value={selectedCategory} onValueChange={(val: any) => setSelectedCategory(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documents">📄 Essential Documents</SelectItem>
                    <SelectItem value="packing">🎒 Packing Essentials</SelectItem>
                    <SelectItem value="health">❤️ Health & Wellness</SelectItem>
                    <SelectItem value="planning">🗺️ Trip Planning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={addPresetChecklist}
                disabled={loading}
                className="w-full earth-gradient"
              >
                {loading ? 'Adding...' : 'Add Checklist'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Checklists */}
      <div className="space-y-4">
        {checklists.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              <Backpack className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-3">No checklists yet</p>
              <p className="text-sm">Click "Add Checklist" to create your first one</p>
            </CardContent>
          </Card>
        ) : (
          checklists.map((checklist) => (
            <Card key={checklist.id} className="overflow-hidden">
              <div
                className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 cursor-pointer hover:bg-gradient-to-r hover:from-emerald-100 hover:to-cyan-100"
                onClick={() => toggleChecklistExpand(checklist.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getCategoryIcon(checklist.category)}
                  <div className="flex-1">
                    <h3 className="font-semibold">{checklist.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                        <div
                          className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-2 rounded-full transition-all"
                          style={{ width: `${getProgress(checklist)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {getProgress(checklist)}% ({checklist.items.filter((i) => i.is_completed).length}/
                        {checklist.items.length})
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChecklist(checklist.id);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    expandedChecklists.has(checklist.id) ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {expandedChecklists.has(checklist.id) && (
                <CardContent className="space-y-3 pt-4">
                  {checklist.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded">
                      <Checkbox
                        checked={item.is_completed}
                        onCheckedChange={() => toggleItem(item.id, item.is_completed)}
                      />
                      <span
                        className={`flex-1 ${
                          item.is_completed ? 'line-through text-gray-400' : 'text-gray-800'
                        }`}
                      >
                        {item.item_text}
                      </span>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {checklists.length > 0 && (
        <Card className="bg-gradient-to-br from-emerald-50 to-cyan-50 border-emerald-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">
                  {checklists.reduce((sum, c) => sum + c.items.length, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {checklists.reduce((sum, c) => sum + c.items.filter((i) => i.is_completed).length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
