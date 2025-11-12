"use client";
import { useState, useEffect, useMemo } from 'react';
import { fetchMarketingData } from '../../src/lib/api';
import { MarketingData, Campaign, DevicePerformance } from '../../src/types/marketing';
import { Navbar } from '../../src/components/ui/navbar';
import { CardMetric } from '../../src/components/ui/card-metric';
import { Footer } from '../../src/components/ui/footer';
import { Smartphone, Monitor, Eye, MousePointer, Target, DollarSign, TrendingUp, Percent } from 'lucide-react';

export default function DeviceView() {
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

  // Aggregate device performance data
  const deviceMetrics = useMemo(() => {
    if (!marketingData?.campaigns) return null;

    // Aggregate device performance across all campaigns
    const deviceMap: { [key: string]: DevicePerformance } = {};

    marketingData.campaigns.forEach((campaign: Campaign) => {
      campaign.device_performance.forEach((device: DevicePerformance) => {
        const deviceKey = device.device.toLowerCase();
        if (!deviceMap[deviceKey]) {
          deviceMap[deviceKey] = {
            device: device.device,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            spend: 0,
            revenue: 0,
            ctr: 0,
            conversion_rate: 0,
            percentage_of_traffic: 0
          };
        }

        // Aggregate metrics
        deviceMap[deviceKey].impressions += device.impressions;
        deviceMap[deviceKey].clicks += device.clicks;
        deviceMap[deviceKey].conversions += device.conversions;
        deviceMap[deviceKey].spend += device.spend;
        deviceMap[deviceKey].revenue += device.revenue;

        // For percentage_of_traffic, we'll use the average across campaigns
        // This is a simplification - in a real scenario, you'd want to weight by campaign size
        deviceMap[deviceKey].percentage_of_traffic = device.percentage_of_traffic;
      });
    });

    // Recalculate CTR and conversion rate based on aggregated data
    Object.values(deviceMap).forEach(device => {
      device.ctr = device.impressions > 0 ? (device.clicks / device.impressions) * 100 : 0;
      device.conversion_rate = device.clicks > 0 ? (device.conversions / device.clicks) * 100 : 0;
    });

    return {
      mobile: deviceMap['mobile'],
      desktop: deviceMap['desktop']
    };
  }, [marketingData?.campaigns]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading device data...</div>
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
                  Device Performance
                </h1>
              )}
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {marketingData && deviceMetrics && (
            <>
              {/* Device Performance Overview */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-6">Device Performance Overview</h2>

                {/* Mobile vs Desktop Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Mobile Metrics */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                      <Smartphone className="h-5 w-5 mr-2 text-blue-400" />
                      Mobile Performance
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <CardMetric
                        title="Impressions"
                        value={deviceMetrics.mobile?.impressions.toLocaleString() || '0'}
                        icon={<Eye className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="Clicks"
                        value={deviceMetrics.mobile?.clicks.toLocaleString() || '0'}
                        icon={<MousePointer className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="Conversions"
                        value={deviceMetrics.mobile?.conversions.toLocaleString() || '0'}
                        icon={<Target className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="Spend"
                        value={`$${deviceMetrics.mobile?.spend.toLocaleString() || '0'}`}
                        icon={<DollarSign className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="Revenue"
                        value={`$${deviceMetrics.mobile?.revenue.toLocaleString() || '0'}`}
                        icon={<TrendingUp className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="Traffic %"
                        value={`${deviceMetrics.mobile?.percentage_of_traffic.toFixed(1) || '0'}%`}
                        icon={<Percent className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="CTR"
                        value={`${deviceMetrics.mobile?.ctr.toFixed(2) || '0'}%`}
                        icon={<MousePointer className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="Conversion Rate"
                        value={`${deviceMetrics.mobile?.conversion_rate.toFixed(2) || '0'}%`}
                        icon={<Target className="h-4 w-4" />}
                      />
                    </div>
                  </div>

                  {/* Desktop Metrics */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                      <Monitor className="h-5 w-5 mr-2 text-green-400" />
                      Desktop Performance
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <CardMetric
                        title="Impressions"
                        value={deviceMetrics.desktop?.impressions.toLocaleString() || '0'}
                        icon={<Eye className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="Clicks"
                        value={deviceMetrics.desktop?.clicks.toLocaleString() || '0'}
                        icon={<MousePointer className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="Conversions"
                        value={deviceMetrics.desktop?.conversions.toLocaleString() || '0'}
                        icon={<Target className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="Spend"
                        value={`$${deviceMetrics.desktop?.spend.toLocaleString() || '0'}`}
                        icon={<DollarSign className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="Revenue"
                        value={`$${deviceMetrics.desktop?.revenue.toLocaleString() || '0'}`}
                        icon={<TrendingUp className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="Traffic %"
                        value={`${deviceMetrics.desktop?.percentage_of_traffic.toFixed(1) || '0'}%`}
                        icon={<Percent className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="CTR"
                        value={`${deviceMetrics.desktop?.ctr.toFixed(2) || '0'}%`}
                        icon={<MousePointer className="h-4 w-4" />}
                      />
                      <CardMetric
                        title="Conversion Rate"
                        value={`${deviceMetrics.desktop?.conversion_rate.toFixed(2) || '0'}%`}
                        icon={<Target className="h-4 w-4" />}
                      />
                    </div>
                  </div>
                </div>

                {/* Performance Comparison Summary */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-4">Performance Comparison</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {deviceMetrics.mobile && deviceMetrics.desktop ?
                          ((deviceMetrics.mobile.clicks / deviceMetrics.desktop.clicks) * 100).toFixed(1) : '0'}%
                      </div>
                      <div className="text-sm text-gray-400">Mobile vs Desktop Clicks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {deviceMetrics.mobile && deviceMetrics.desktop ?
                          ((deviceMetrics.mobile.conversions / deviceMetrics.desktop.conversions) * 100).toFixed(1) : '0'}%
                      </div>
                      <div className="text-sm text-gray-400">Mobile vs Desktop Conversions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-1">
                        {deviceMetrics.mobile && deviceMetrics.desktop ?
                          ((deviceMetrics.mobile.revenue / deviceMetrics.desktop.revenue) * 100).toFixed(1) : '0'}%
                      </div>
                      <div className="text-sm text-gray-400">Mobile vs Desktop Revenue</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}
