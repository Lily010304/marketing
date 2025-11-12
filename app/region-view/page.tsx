"use client";
import { useState, useEffect, useMemo } from 'react';
import { fetchMarketingData } from '../../src/lib/api';
import { MarketingData, Campaign, RegionalPerformance } from '../../src/types/marketing';
import { Navbar } from '../../src/components/ui/navbar';
import { HeatMap } from '../../src/components/ui/heat-map';
import { Footer } from '../../src/components/ui/footer';

// UAE coordinates for major cities
const uaeCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Sharjah': { lat: 25.3463, lng: 55.4209 },
  'Abu Dhabi': { lat: 24.4539, lng: 54.3773 },
  'Ajman': { lat: 25.4052, lng: 55.5136 },
  'Ras Al Khaimah': { lat: 25.6741, lng: 55.9804 },
  'Fujairah': { lat: 25.1288, lng: 56.3265 },
  'Umm Al Quwain': { lat: 25.5653, lng: 55.5533 },
  'Al Ain': { lat: 24.1302, lng: 55.8023 },
  'Riyadh': { lat: 24.7136, lng: 46.6753 },
  'Jeddah': { lat: 21.4858, lng: 39.1925 },
  'Doha': { lat: 25.2854, lng: 51.5310 },
  'Muscat': { lat: 23.5880, lng: 58.3829 },
  'Manama': { lat: 26.2235, lng: 50.5876 },
  'Kuwait City': { lat: 29.3759, lng: 47.9774 },
  'Cairo': { lat: 30.0444, lng: 31.2357 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Singapore': { lat: 1.3521, lng: 103.8198 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
};

export default function RegionView() {
  const [marketingData, setMarketingData] = useState<MarketingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchMarketingData();
        setMarketingData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading marketing data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Process regional performance data
  const regionalData = useMemo(() => {
    if (!marketingData?.campaigns) return null;

    // Aggregate regional performance across all campaigns
    const regionMap: { [key: string]: { spend: number, revenue: number, country: string } } = {};

    marketingData.campaigns.forEach((campaign: Campaign) => {
      campaign.regional_performance.forEach((region: RegionalPerformance) => {
        if (!regionMap[region.region]) {
          regionMap[region.region] = {
            spend: 0,
            revenue: 0,
            country: region.country
          };
        }
        regionMap[region.region].spend += region.spend;
        regionMap[region.region].revenue += region.revenue;
      });
    });

    // Convert to heat map format with real coordinates
    const revenueData = Object.entries(regionMap).map(([region, data]) => {
      const coords = uaeCoordinates[region] || { lat: 24.0, lng: 54.0 };
      return {
        region,
        country: data.country,
        value: data.revenue,
        lat: coords.lat,
        lng: coords.lng
      };
    });

    const spendData = Object.entries(regionMap).map(([region, data]) => {
      const coords = uaeCoordinates[region] || { lat: 24.0, lng: 54.0 };
      return {
        region,
        country: data.country,
        value: data.spend,
        lat: coords.lat,
        lng: coords.lng
      };
    });

    return { revenueData, spendData };
  }, [marketingData?.campaigns]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading regional data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Navbar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-12">
          <div className="px-6 lg:px-8">
            <div className="text-center">
              {error ? (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4 max-w-2xl mx-auto">
                  Error loading data: {error}
                </div>
              ) : (
                <h1 className="text-3xl md:text-5xl font-bold">
                  Regional Performance
                </h1>
              )}
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {marketingData && regionalData && (
            <>
              {/* Regional Heat Maps */}
              <div className="space-y-8">
                {/* Revenue Heat Map */}
                <HeatMap
                  title="Revenue by Region"
                  data={regionalData.revenueData}
                  height={600}
                  formatValue={(value) => `$${value.toLocaleString()}`}
                />

                {/* Spend Heat Map */}
                <HeatMap
                  title="Spend by Region"
                  data={regionalData.spendData}
                  height={600}
                  formatValue={(value) => `$${value.toLocaleString()}`}
                />
              </div>
            </>
          )}
        </div>
        
        <Footer />
      </div>
    </div>
  );
}
