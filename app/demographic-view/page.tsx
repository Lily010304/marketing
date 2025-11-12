"use client";
import { useState, useEffect, useMemo } from 'react';
import { fetchMarketingData } from '../../src/lib/api';
import { MarketingData, Campaign, DemographicBreakdown } from '../../src/types/marketing';
import { Navbar } from '../../src/components/ui/navbar';
import { CardMetric } from '../../src/components/ui/card-metric';
import { BarChart } from '../../src/components/ui/bar-chart';
import { Table } from '../../src/components/ui/table';
import { Footer } from '../../src/components/ui/footer';
import { Users, UserCheck, TrendingUp, Target, DollarSign, MousePointer } from 'lucide-react';

export default function DemographicView() {
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

  // Calculate demographic metrics
  const demographicMetrics = useMemo(() => {
    if (!marketingData?.campaigns) return null;

    let totalClicks = 0;
    let maleClicks = 0;
    let femaleClicks = 0;
    let totalSpend = 0;
    let totalRevenue = 0;
    const ageGroupClicks: { [key: string]: number } = {};
    const maleAgeGroupData: { [key: string]: { impressions: number, clicks: number, conversions: number } } = {};
    const femaleAgeGroupData: { [key: string]: { impressions: number, clicks: number, conversions: number } } = {};

    marketingData.campaigns.forEach((campaign: Campaign) => {
      totalSpend += campaign.spend;
      totalRevenue += campaign.revenue;

      campaign.demographic_breakdown.forEach((demo: DemographicBreakdown) => {
        const clicks = demo.performance.clicks;
        totalClicks += clicks;

        if (demo.gender.toLowerCase() === 'male') {
          maleClicks += clicks;
          
          // Aggregate male age group data
          if (!maleAgeGroupData[demo.age_group]) {
            maleAgeGroupData[demo.age_group] = { impressions: 0, clicks: 0, conversions: 0 };
          }
          maleAgeGroupData[demo.age_group].impressions += demo.performance.impressions;
          maleAgeGroupData[demo.age_group].clicks += demo.performance.clicks;
          maleAgeGroupData[demo.age_group].conversions += demo.performance.conversions;
        } else if (demo.gender.toLowerCase() === 'female') {
          femaleClicks += clicks;
          
          // Aggregate female age group data
          if (!femaleAgeGroupData[demo.age_group]) {
            femaleAgeGroupData[demo.age_group] = { impressions: 0, clicks: 0, conversions: 0 };
          }
          femaleAgeGroupData[demo.age_group].impressions += demo.performance.impressions;
          femaleAgeGroupData[demo.age_group].clicks += demo.performance.clicks;
          femaleAgeGroupData[demo.age_group].conversions += demo.performance.conversions;
        }

        // Aggregate clicks by age group for bar charts
        if (!ageGroupClicks[demo.age_group]) {
          ageGroupClicks[demo.age_group] = 0;
        }
        ageGroupClicks[demo.age_group] += clicks;
      });
    });

    // Calculate proportional spend and revenue based on click distribution
    const maleClickRatio = totalClicks > 0 ? maleClicks / totalClicks : 0;
    const femaleClickRatio = totalClicks > 0 ? femaleClicks / totalClicks : 0;

    // Calculate spend and revenue by age group proportionally
    const ageGroupData = Object.entries(ageGroupClicks).map(([ageGroup, clicks]) => {
      const clickRatio = totalClicks > 0 ? clicks / totalClicks : 0;
      return {
        ageGroup,
        clicks,
        spend: totalSpend * clickRatio,
        revenue: totalRevenue * clickRatio,
      };
    }).sort((a, b) => b.clicks - a.clicks); // Sort by clicks descending

    // Prepare table data for male age groups
    const maleTableData = Object.entries(maleAgeGroupData).map(([ageGroup, data]) => ({
      ageGroup,
      impressions: data.impressions,
      clicks: data.clicks,
      conversions: data.conversions,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
      conversionRate: data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0,
    })).sort((a, b) => b.clicks - a.clicks);

    // Prepare table data for female age groups
    const femaleTableData = Object.entries(femaleAgeGroupData).map(([ageGroup, data]) => ({
      ageGroup,
      impressions: data.impressions,
      clicks: data.clicks,
      conversions: data.conversions,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
      conversionRate: data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0,
    })).sort((a, b) => b.clicks - a.clicks);

    return {
      maleClicks,
      femaleClicks,
      maleSpend: totalSpend * maleClickRatio,
      femaleSpend: totalSpend * femaleClickRatio,
      maleRevenue: totalRevenue * maleClickRatio,
      femaleRevenue: totalRevenue * femaleClickRatio,
      ageGroupData,
      maleTableData,
      femaleTableData,
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
                  Demographic View
                </h1>
              )}
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {marketingData && demographicMetrics && (
            <>
              {/* Demographic Overview Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <CardMetric
                  title="Total Clicks by Males"
                  value={demographicMetrics.maleClicks.toLocaleString()}
                  icon={<MousePointer className="h-5 w-5" />}
                />
                
                <CardMetric
                  title="Total Spend by Males"
                  value={`$${demographicMetrics.maleSpend.toLocaleString()}`}
                  icon={<DollarSign className="h-5 w-5" />}
                />
                
                <CardMetric
                  title="Total Revenue by Males"
                  value={`$${demographicMetrics.maleRevenue.toLocaleString()}`}
                  icon={<TrendingUp className="h-5 w-5" />}
                />
                
                <CardMetric
                  title="Total Clicks by Females"
                  value={demographicMetrics.femaleClicks.toLocaleString()}
                  icon={<MousePointer className="h-5 w-5" />}
                />
                
                <CardMetric
                  title="Total Spend by Females"
                  value={`$${demographicMetrics.femaleSpend.toLocaleString()}`}
                  icon={<DollarSign className="h-5 w-5" />}
                />
                
                <CardMetric
                  title="Total Revenue by Females"
                  value={`$${demographicMetrics.femaleRevenue.toLocaleString()}`}
                  icon={<TrendingUp className="h-5 w-5" />}
                />
              </div>

              {/* Demographic Performance Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
                {/* Total Spend by Age Group */}
                <BarChart
                  title="Total Spend by Age Group"
                  data={demographicMetrics.ageGroupData.map(item => ({
                    label: item.ageGroup,
                    value: item.spend,
                    color: '#3B82F6'
                  }))}
                  formatValue={(value) => `$${value.toLocaleString()}`}
                />

                {/* Total Revenue by Age Group */}
                <BarChart
                  title="Total Revenue by Age Group"
                  data={demographicMetrics.ageGroupData.map(item => ({
                    label: item.ageGroup,
                    value: item.revenue,
                    color: '#10B981'
                  }))}
                  formatValue={(value) => `$${value.toLocaleString()}`}
                />
              </div>

              {/* Demographic Performance Tables */}
              <div className="space-y-6">
                {/* Campaign Performance by Male Age Groups */}
                <Table
                  title="Campaign Performance by Male Age Groups"
                  showIndex={true}
                  maxHeight="400px"
                  columns={[
                    {
                      key: 'ageGroup',
                      header: 'Age Group',
                      width: '20%',
                      sortable: true,
                      sortType: 'string',
                      render: (value) => (
                        <span className="font-medium text-white">
                          {value}
                        </span>
                      )
                    },
                    {
                      key: 'impressions',
                      header: 'Impressions',
                      width: '20%',
                      align: 'right',
                      sortable: true,
                      sortType: 'number',
                      render: (value) => (
                        <span className="text-gray-300">
                          {value.toLocaleString()}
                        </span>
                      )
                    },
                    {
                      key: 'clicks',
                      header: 'Clicks',
                      width: '15%',
                      align: 'right',
                      sortable: true,
                      sortType: 'number',
                      render: (value) => (
                        <span className="text-blue-400 font-medium">
                          {value.toLocaleString()}
                        </span>
                      )
                    },
                    {
                      key: 'conversions',
                      header: 'Conversions',
                      width: '15%',
                      align: 'right',
                      sortable: true,
                      sortType: 'number',
                      render: (value) => (
                        <span className="text-green-400 font-medium">
                          {value.toLocaleString()}
                        </span>
                      )
                    },
                    {
                      key: 'ctr',
                      header: 'CTR',
                      width: '15%',
                      align: 'right',
                      sortable: true,
                      sortType: 'number',
                      render: (value) => (
                        <span className="text-yellow-400">
                          {value.toFixed(2)}%
                        </span>
                      )
                    },
                    {
                      key: 'conversionRate',
                      header: 'Conversion Rate',
                      width: '15%',
                      align: 'right',
                      sortable: true,
                      sortType: 'number',
                      render: (value) => (
                        <span className="text-purple-400">
                          {value.toFixed(2)}%
                        </span>
                      )
                    }
                  ]}
                  defaultSort={{ key: 'clicks', direction: 'desc' }}
                  data={demographicMetrics.maleTableData}
                  emptyMessage="No male demographic data available"
                />

                {/* Campaign Performance by Female Age Groups */}
                <Table
                  title="Campaign Performance by Female Age Groups"
                  showIndex={true}
                  maxHeight="400px"
                  columns={[
                    {
                      key: 'ageGroup',
                      header: 'Age Group',
                      width: '20%',
                      sortable: true,
                      sortType: 'string',
                      render: (value) => (
                        <span className="font-medium text-white">
                          {value}
                        </span>
                      )
                    },
                    {
                      key: 'impressions',
                      header: 'Impressions',
                      width: '20%',
                      align: 'right',
                      sortable: true,
                      sortType: 'number',
                      render: (value) => (
                        <span className="text-gray-300">
                          {value.toLocaleString()}
                        </span>
                      )
                    },
                    {
                      key: 'clicks',
                      header: 'Clicks',
                      width: '15%',
                      align: 'right',
                      sortable: true,
                      sortType: 'number',
                      render: (value) => (
                        <span className="text-blue-400 font-medium">
                          {value.toLocaleString()}
                        </span>
                      )
                    },
                    {
                      key: 'conversions',
                      header: 'Conversions',
                      width: '15%',
                      align: 'right',
                      sortable: true,
                      sortType: 'number',
                      render: (value) => (
                        <span className="text-green-400 font-medium">
                          {value.toLocaleString()}
                        </span>
                      )
                    },
                    {
                      key: 'ctr',
                      header: 'CTR',
                      width: '15%',
                      align: 'right',
                      sortable: true,
                      sortType: 'number',
                      render: (value) => (
                        <span className="text-yellow-400">
                          {value.toFixed(2)}%
                        </span>
                      )
                    },
                    {
                      key: 'conversionRate',
                      header: 'Conversion Rate',
                      width: '15%',
                      align: 'right',
                      sortable: true,
                      sortType: 'number',
                      render: (value) => (
                        <span className="text-purple-400">
                          {value.toFixed(2)}%
                        </span>
                      )
                    }
                  ]}
                  defaultSort={{ key: 'clicks', direction: 'desc' }}
                  data={demographicMetrics.femaleTableData}
                  emptyMessage="No female demographic data available"
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
