import React, { useEffect, useState } from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Cloud,
  Thermometer,
  DollarSign,
  Globe,
  AlertCircle,
  CheckCircle,
  MapPin,
  Calendar,
} from 'lucide-react';
import type { DestinationInfo } from '@/hooks/useRecommendations';

interface DestinationInfoCardProps {
  destination: string;
}

export const DestinationInfoCard: React.FC<DestinationInfoCardProps> = ({ destination }) => {
  const { getDestinationInfo } = useRecommendations();
  const [info, setInfo] = useState<DestinationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInfo = async () => {
      setLoading(true);
      const data = await getDestinationInfo(destination);
      setInfo(data);
      setLoading(false);
    };
    loadInfo();
  }, [destination, getDestinationInfo]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-32 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!info) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-gray-600">No information available for {destination}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{info.destination}</CardTitle>
            {info.description && (
              <CardDescription className="mt-2">{info.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Currency */}
          {info.currency && (
            <div className="p-3 rounded-lg bg-white/80">
              <p className="text-xs text-gray-600 mb-1">Currency</p>
              <p className="font-semibold">{info.currency}</p>
            </div>
          )}

          {/* Languages */}
          {info.language && info.language.length > 0 && (
            <div className="p-3 rounded-lg bg-white/80">
              <p className="text-xs text-gray-600 mb-1">Languages</p>
              <p className="font-semibold text-sm">{info.language.join(', ')}</p>
            </div>
          )}

          {/* Visa Info */}
          <div className="p-3 rounded-lg bg-white/80">
            <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              {info.visa_required ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Visa Required
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Visa Not Required
                </>
              )}
            </p>
          </div>
        </div>

        {/* Temperature Info */}
        <div className="grid grid-cols-2 gap-4">
          {info.avg_temperature_summer !== undefined && (
            <div className="p-4 bg-orange-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4 text-orange-600" />
                <p className="text-xs font-semibold text-orange-800">Summer</p>
              </div>
              <p className="text-2xl font-bold text-orange-700">
                {info.avg_temperature_summer}°C
              </p>
            </div>
          )}
          {info.avg_temperature_winter !== undefined && (
            <div className="p-4 bg-blue-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-semibold text-blue-800">Winter</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {info.avg_temperature_winter}°C
              </p>
            </div>
          )}
        </div>

        {/* Daily Costs */}
        {(info.avg_daily_cost_budget || info.avg_daily_cost_mid || info.avg_daily_cost_luxury) && (
          <div className="bg-white/80 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Average Daily Costs
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {info.avg_daily_cost_budget && (
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Budget</p>
                  <p className="font-bold text-lg">${info.avg_daily_cost_budget}</p>
                </div>
              )}
              {info.avg_daily_cost_mid && (
                <div className="text-center border-l border-r border-gray-300">
                  <p className="text-xs text-gray-600 mb-1">Mid-range</p>
                  <p className="font-bold text-lg text-blue-600">
                    ${info.avg_daily_cost_mid}
                  </p>
                </div>
              )}
              {info.avg_daily_cost_luxury && (
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Luxury</p>
                  <p className="font-bold text-lg text-purple-600">
                    ${info.avg_daily_cost_luxury}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Best Time to Visit */}
        {info.best_time_to_visit && info.best_time_to_visit.length > 0 && (
          <div className="bg-white/80 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Best Time to Visit
            </h3>
            <div className="flex flex-wrap gap-2">
              {info.best_time_to_visit.map((season) => (
                <Badge key={season} variant="secondary">
                  {season}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        {info.highlights && info.highlights.length > 0 && (
          <div className="bg-white/80 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Highlights</h3>
            <ul className="space-y-2">
              {info.highlights.slice(0, 4).map((highlight, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Popular Activities */}
        {info.popular_activities && info.popular_activities.length > 0 && (
          <div className="bg-white/80 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Popular Activities</h3>
            <div className="flex flex-wrap gap-2">
              {info.popular_activities.slice(0, 6).map((activity) => (
                <Badge key={activity} variant="outline" className="text-blue-700 border-blue-300">
                  {activity}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
