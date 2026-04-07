import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, DollarSign, Users, Share2 } from 'lucide-react';
import type { Trip } from '@/hooks/useTrips';

interface TripComparisonProps {
  trips: Trip[];
  onSelectTrip?: (trip: Trip) => void;
}

export const TripComparison: React.FC<TripComparisonProps> = ({ trips, onSelectTrip }) => {
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);

  const toggleTripSelection = (tripId: string) => {
    setSelectedTrips((prev) =>
      prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId]
    );
  };

  const selectedTripData = trips.filter((t) => selectedTrips.includes(t.id));

  const calculateStats = () => {
    if (selectedTripData.length === 0) return null;

    return {
      avgCost:
        selectedTripData.reduce((sum, t) => sum + (t.total_cost || 0), 0) / selectedTripData.length,
      totalCost: selectedTripData.reduce((sum, t) => sum + (t.total_cost || 0), 0),
      tripCount: selectedTripData.length,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Compare Trips</h2>
        <p className="text-gray-600">Select multiple trips to compare side-by-side</p>
      </div>

      {/* Trip Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trips.map((trip) => (
          <Card
            key={trip.id}
            className={`cursor-pointer transition-all ${
              selectedTrips.includes(trip.id)
                ? 'ring-2 ring-emerald-500 shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => toggleTripSelection(trip.id)}
          >
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <CardTitle className="line-clamp-2">{trip.title}</CardTitle>
                  {trip.destination && (
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {trip.destination}
                    </CardDescription>
                  )}
                </div>
                <div
                  className="w-6 h-6 rounded border-2 border-emerald-500 flex items-center justify-center flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectedTrips.includes(trip.id) && <div className="w-4 h-4 bg-emerald-500 rounded" />}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Date Range */}
              {trip.start_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(trip.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  {trip.end_date && (
                    <>
                      -{' '}
                      {new Date(trip.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </>
                  )}
                </div>
              )}

              {/* Cost */}
              <div className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="w-4 h-4" />
                {trip.total_cost.toFixed(2)} {trip.currency}
              </div>

              {/* Status */}
              <div className="flex gap-2 flex-wrap">
                {trip.is_public && <Badge variant="secondary">Shared</Badge>}
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  Created {new Date(trip.created_at).toLocaleDateString()}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTrip?.(trip);
                  }}
                >
                  View
                </Button>
                {trip.is_public && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()}
                    className="gap-1"
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      {selectedTripData.length > 1 && (
        <Card className="bg-gradient-to-br from-emerald-50 to-cyan-50 border-emerald-200">
          <CardHeader>
            <CardTitle>Comparison Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-emerald-200">
                    <th className="text-left py-2 px-3">Trip Name</th>
                    <th className="text-left py-2 px-3">Destination</th>
                    <th className="text-right py-2 px-3">Cost</th>
                    <th className="text-center py-2 px-3">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTripData.map((trip) => {
                    const startDate = trip.start_date ? new Date(trip.start_date) : null;
                    const endDate = trip.end_date ? new Date(trip.end_date) : null;
                    const duration = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

                    return (
                      <tr key={trip.id} className="border-b border-emerald-100 hover:bg-white/50">
                        <td className="py-3 px-3 font-medium">{trip.title}</td>
                        <td className="py-3 px-3 text-gray-600">{trip.destination || '—'}</td>
                        <td className="py-3 px-3 text-right font-semibold">
                          {trip.total_cost.toFixed(2)} {trip.currency}
                        </td>
                        <td className="py-3 px-3 text-center text-gray-600">
                          {duration > 0 ? `${duration} days` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            {stats && (
              <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-emerald-200">
                <div>
                  <p className="text-xs text-gray-600">Average Cost</p>
                  <p className="text-lg font-bold">
                    ${stats.avgCost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Cost</p>
                  <p className="text-lg font-bold">
                    ${stats.totalCost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Trips Compared</p>
                  <p className="text-lg font-bold">{stats.tripCount}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {trips.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-4">No trips found</p>
            <p className="text-sm text-gray-500">Create a new trip to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
