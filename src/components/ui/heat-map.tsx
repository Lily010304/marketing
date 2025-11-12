"use client";

import { useEffect, useRef, useState } from 'react';

interface HeatMapDataPoint {
  region: string;
  country: string;
  value: number;
  lat: number; // Latitude
  lng: number; // Longitude
  color?: string;
}

interface HeatMapProps {
  title: string;
  data: HeatMapDataPoint[];
  className?: string;
  height?: number;
  formatValue?: (value: number) => string;
}

// UAE coordinates and major cities
const uaeCoordinates: { [key: string]: { lat: number; lng: number } } = {
  // UAE Emirates
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Sharjah': { lat: 25.3463, lng: 55.4209 },
  'Abu Dhabi': { lat: 24.4539, lng: 54.3773 },
  'Ajman': { lat: 25.4052, lng: 55.5136 },
  'Ras Al Khaimah': { lat: 25.6741, lng: 55.9804 },
  'Fujairah': { lat: 25.1288, lng: 56.3265 },
  'Umm Al Quwain': { lat: 25.5653, lng: 55.5533 },
  'Al Ain': { lat: 24.1302, lng: 55.8023 },
  
  // Other Middle Eastern cities
  'Riyadh': { lat: 24.7136, lng: 46.6753 },
  'Jeddah': { lat: 21.4858, lng: 39.1925 },
  'Doha': { lat: 25.2854, lng: 51.5310 },
  'Muscat': { lat: 23.5880, lng: 58.3829 },
  'Manama': { lat: 26.2235, lng: 50.5876 },
  'Kuwait City': { lat: 29.3759, lng: 47.9774 },
  
  // International cities
  'Cairo': { lat: 30.0444, lng: 31.2357 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Singapore': { lat: 1.3521, lng: 103.8198 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
};

export function HeatMap({
  title,
  data,
  className = "",
  height = 500,
  formatValue = (value) => value.toLocaleString()
}: HeatMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    // Dynamically import Leaflet only on client side
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        const L = (await import('leaflet')).default;
        
        // Load CSS dynamically
        if (typeof document !== 'undefined') {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
          document.head.appendChild(link);
        }
        
        // Fix for default markers in Leaflet with Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        setLeafletLoaded(true);
        
        if (!mapRef.current || !data || data.length === 0) return;

        // Initialize map centered on UAE
        const map = L.map(mapRef.current).setView([24.0, 54.0], 7);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map);

        // Find min and max values for scaling
        const values = data.map(d => d.value);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);

        // Color scale
        const colorScale = [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
          '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
        ];

        // Add circles for each data point
        data.forEach((point, index) => {
          const coords = uaeCoordinates[point.region] || { lat: 24.0, lng: 54.0 };
          
          // Calculate circle size based on value (smaller range)
          const normalized = maxValue === minValue ? 0.5 : (point.value - minValue) / (maxValue - minValue);
          const radius = 10000 + normalized * 150000; // Base 10km + up to 150km
          
          const color = point.color || colorScale[index % colorScale.length];

          // Create circle
          const circle = L.circle([coords.lat, coords.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.6,
            radius: radius
          }).addTo(map);

          // Add popup with information
          circle.bindPopup(`
            <div class="p-2 min-w-40">
              <h3 class="font-bold text-lg">${point.region}</h3>
              <p class="text-gray-600">${point.country}</p>
              <p class="text-green-600 font-semibold mt-2">${formatValue(point.value)}</p>
            </div>
          `);

          // Add marker with label
          const marker = L.marker([coords.lat, coords.lng], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: `
                <div class="bg-white bg-opacity-90 rounded-full px-2 py-1 border-2 border-gray-800 shadow-lg text-xs font-bold text-gray-800 whitespace-nowrap">
                  ${point.region}
                </div>
              `,
              iconSize: [60, 20],
              iconAnchor: [30, 10]
            })
          }).addTo(map);

          // Show value on hover for marker
          marker.bindTooltip(`
            <div class="font-semibold">
              ${point.region}: ${formatValue(point.value)}
            </div>
          `);
        });

        // Fit map to show all circles
        const group = new L.FeatureGroup();
        data.forEach(point => {
          const coords = uaeCoordinates[point.region];
          if (coords) {
            group.addLayer(L.marker([coords.lat, coords.lng]));
          }
        });
        
        if (group.getLayers().length > 0) {
          map.fitBounds(group.getBounds().pad(0.1));
        }

        mapInstanceRef.current = map;
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
      }
    };

    loadLeaflet();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data, formatValue, leafletLoaded]);

  if (!data || data.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-96 text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>

      {/* Map container */}
      <div 
        ref={mapRef} 
        className="bg-gray-700 rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />

      {/* Data table below map */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-3 text-gray-400 font-medium">Color</th>
              <th className="text-left py-2 px-3 text-gray-400 font-medium">Region</th>
              <th className="text-left py-2 px-3 text-gray-400 font-medium">Country</th>
              <th className="text-right py-2 px-3 text-gray-400 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {data
              .sort((a, b) => b.value - a.value)
              .map((point, index) => {
                const colorScale = [
                  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
                ];
                const color = point.color || colorScale[index % colorScale.length];
                return (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="py-2 px-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </td>
                    <td className="py-2 px-3 text-gray-300">{point.region}</td>
                    <td className="py-2 px-3 text-gray-300">{point.country}</td>
                    <td className="py-2 px-3 text-right text-gray-300 font-medium">
                      {formatValue(point.value)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
