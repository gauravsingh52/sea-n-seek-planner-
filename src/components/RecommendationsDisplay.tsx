import React, { useEffect, useState } from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, MapPin, DollarSign, X, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import type { Recommendation } from '@/hooks/useRecommendations';

interface RecommendationsDisplayProps {
  tripId: string;
  destination?: string;
}

export const RecommendationsDisplay: React.FC<RecommendationsDisplayProps> = ({
  tripId,
  destination,
}) => {
  const { recommendations, fetchRecommendations, dismissRecommendation, saveRecommendation, generateRecommendations } =
    useRecommendations();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      await fetchRecommendations(tripId);
      if (recommendations.length === 0 && destination) {
        await generateRecommendations(tripId, destination);
        await fetchRecommendations(tripId);
      }
      setLoading(false);
    };
    loadRecommendations();
  }, [tripId, destination]);

  const handleDismiss = async (id: string) => {
    await dismissRecommendation(id);
    toast.success('Recommendation dismissed');
  };

  const handleSave = async (id: string) => {
    const success = await saveRecommendation(id);
    if (success) {
      setSaved((prev) => new Set([...prev, id]));
      toast.success('Saved for later');
    }
  };

  const getTypeIcon = (type: Recommendation['recommendation_type']) => {
    switch (type) {
      case 'activity':
        return '🎭';
      case 'restaurant':
        return '🍽️';
      case 'accommodation':
        return '🏨';
      case 'transport':
        return '🚗';
      case 'weather_advisory':
        return '🌤️';
      default:
        return '✨';
    }
  };

  const getTypeColor = (type: Recommendation['recommendation_type']) => {
    switch (type) {
      case 'activity':
        return 'bg-purple-100 text-purple-800';
      case 'restaurant':
        return 'bg-orange-100 text-orange-800';
      case 'accommodation':
        return 'bg-blue-100 text-blue-800';
      case 'transport':
        return 'bg-green-100 text-green-800';
      case 'weather_advisory':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h2 className="text-xl font-bold">Smart Recommendations</h2>
        <Badge variant="secondary" className="ml-auto">
          {recommendations.length}
        </Badge>
      </div>

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-gray-600">No recommendations yet</p>
            <p className="text-sm text-gray-500 mt-1">They will appear once your trip is ready</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Type Icon */}
                  <div className={`text-2xl p-2 rounded-lg ${getTypeColor(rec.recommendation_type)}`}>
                    {getTypeIcon(rec.recommendation_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-lg leading-tight">{rec.title}</h3>
                      <Badge variant="outline" className={getTypeColor(rec.recommendation_type)}>
                        {rec.recommendation_type}
                      </Badge>
                    </div>

                    {rec.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{rec.description}</p>
                    )}

                    {/* Details */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
                      {rec.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {rec.location}
                        </div>
                      )}
                      {rec.price_range && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {rec.price_range}
                        </div>
                      )}
                      {rec.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {rec.rating}
                        </div>
                      )}
                      {rec.relevance_score && (
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          {(rec.relevance_score * 100).toFixed(0)}% match
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSave(rec.id)}
                        className={`gap-1 ${saved.has(rec.id) ? 'border-blue-500 text-blue-600' : ''}`}
                      >
                        <Bookmark className="w-3 h-3" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(rec.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
