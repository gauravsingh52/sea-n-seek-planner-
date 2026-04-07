import React, { useState, useEffect } from 'react';
import { useBudget } from '@/hooks/useBudget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, BarChart3, Plus, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface BudgetTrackerProps {
  tripId: string;
}

const CATEGORIES = [
  { value: 'accommodation', label: '🏨 Accommodation', color: 'bg-blue-100 text-blue-800' },
  { value: 'food', label: '🍽️ Food & Dining', color: 'bg-orange-100 text-orange-800' },
  { value: 'transport', label: '🚗 Transport', color: 'bg-green-100 text-green-800' },
  { value: 'activities', label: '🎭 Activities', color: 'bg-purple-100 text-purple-800' },
  { value: 'shopping', label: '🛍️ Shopping', color: 'bg-pink-100 text-pink-800' },
  { value: 'other', label: '📌 Other', color: 'bg-gray-100 text-gray-800' },
];

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ tripId }) => {
  const { budgetItems, summary, fetchBudgetItems, addBudgetItem, deleteBudgetItem } = useBudget();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'activities',
    description: '',
    amount: '',
    is_actual: false,
  });

  useEffect(() => {
    fetchBudgetItems(tripId);
  }, [tripId]);

  const handleAddItem = async () => {
    if (!formData.description || !formData.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await addBudgetItem(tripId, {
        category: formData.category as any,
        description: formData.description,
        amount: parseFloat(formData.amount),
        currency: 'USD',
        is_actual: formData.is_actual,
      });
      toast.success('Budget item added');
      setFormData({ category: 'activities', description: '', amount: '', is_actual: false });
      setShowDialog(false);
    } catch (error) {
      toast.error('Failed to add budget item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Delete this item?')) return;
    const success = await deleteBudgetItem(itemId, tripId);
    if (success) toast.success('Item deleted');
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find((c) => c.value === category)?.color || 'bg-gray-100';
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  const totalEstimated = summary?.total_estimated || 0;
  const totalActual = summary?.total_actual || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Budget Tracker
        </h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 earth-gradient">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Budget Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="What did you spend on?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="actual"
                  checked={formData.is_actual}
                  onChange={(e) => setFormData({ ...formData, is_actual: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="actual" className="text-sm">
                  Mark as actual expense
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAddItem} disabled={loading} className="flex-1 earth-gradient">
                  {loading ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Estimated Budget</p>
                <p className="text-3xl font-bold text-blue-600">${totalEstimated.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${totalActual > totalEstimated ? 'from-red-50 to-orange-50 border-red-200' : 'from-green-50 to-emerald-50 border-green-200'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Actual Spending</p>
                <p className={`text-3xl font-bold ${totalActual > totalEstimated ? 'text-red-600' : 'text-green-600'}`}>
                  ${totalActual.toFixed(2)}
                </p>
              </div>
              <BarChart3 className={`w-12 h-12 ${totalActual > totalEstimated ? 'text-red-300' : 'text-green-300'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>{budgetItems.length} items</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {budgetItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No expenses yet</p>
          ) : (
            budgetItems.map((item) => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${getCategoryColor(item.category)}`}>
                <div className="flex-1">
                  <p className="font-medium">{item.description}</p>
                  <p className="text-xs opacity-75">{getCategoryLabel(item.category)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${item.amount.toFixed(2)}</p>
                  {item.is_actual && <p className="text-xs opacity-75">Paid</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-700 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {summary && Object.keys(summary.by_category).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Breakdown by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(summary.by_category).map(([category, data]: any) => (
              <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <p className="font-medium">{getCategoryLabel(category)}</p>
                <div className="text-right text-sm">
                  <p><span className="text-gray-600">Est:</span> <span className="font-semibold">${data.estimated.toFixed(2)}</span></p>
                  <p><span className="text-gray-600">Act:</span> <span className="font-semibold">${data.actual.toFixed(2)}</span></p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
