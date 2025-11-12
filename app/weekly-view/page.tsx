"use client";
import { useState, useEffect, useMemo } from 'react';
import { fetchMarketingData } from '../../src/lib/api';
import { MarketingData, Campaign } from '../../src/types/marketing';
import { Navbar } from '../../src/components/ui/navbar';
import { LineChart } from '../../src/components/ui/line-chart';
import { Footer } from '../../src/components/ui/footer';

export default function WeeklyView() {
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

  // Process weekly performance data
  const weeklyChartData = useMemo(() => {
    if (!marketingData?.campaigns) return null;

    // Aggregate weekly performance across all campaigns
    const weeklyData: { [key: string]: { spend: number, revenue: number, weekLabel: string } } = {};

    marketingData.campaigns.forEach((campaign: Campaign) => {
      campaign.weekly_performance.forEach((week) => {
        const weekKey = `${week.week_start} to ${week.week_end}`;
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            spend: 0,
            revenue: 0,
            weekLabel: weekKey
          };
        }
        weeklyData[weekKey].spend += week.spend;
        weeklyData[weekKey].revenue += week.revenue;
      });
    });

    // Convert to chart format and sort by week start date
    const sortedWeeks = Object.values(weeklyData).sort((a, b) => {
      const aStart = a.weekLabel.split(' to ')[0];
      const bStart = b.weekLabel.split(' to ')[0];
      return new Date(aStart).getTime() - new Date(bStart).getTime();
    });

    return {
      spendData: sortedWeeks.map(week => ({
        label: week.weekLabel.split(' to ')[0], // Just show start date for cleaner labels
        value: week.spend
      })),
      revenueData: sortedWeeks.map(week => ({
        label: week.weekLabel.split(' to ')[0], // Just show start date for cleaner labels
        value: week.revenue
      }))
    };
  }, [marketingData?.campaigns]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
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
                  Weekly View
                </h1>
              )}
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {marketingData && weeklyChartData && (
            <>
              {/* Weekly Performance Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                <LineChart
                  title="Weekly Revenue and Spend Trends"
                  series={[
                    {
                      name: "Revenue",
                      data: weeklyChartData.revenueData,
                      color: "#10B981"
                    },
                    {
                      name: "Spend",
                      data: weeklyChartData.spendData,
                      color: "#3B82F6"
                    }
                  ]}
                  height={400}
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
