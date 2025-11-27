import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardChartsProps {
  stats?: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
    platformStats: { platform: string; count: number }[];
    categoryStats: { category: string; count: number }[];
  };
}

export function DashboardCharts({ stats }: DashboardChartsProps) {
  const difficultyChartRef = useRef<HTMLCanvasElement>(null);
  const progressChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Load Chart.js dynamically
    const loadChartJS = async () => {
      const Chart = (await import('chart.js/auto')).default;
      
      if (difficultyChartRef.current && stats) {
        // Destroy existing chart if it exists
        const existingChart = Chart.getChart(difficultyChartRef.current);
        if (existingChart) {
          existingChart.destroy();
        }

        // Difficulty Distribution Doughnut Chart
        new Chart(difficultyChartRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Easy', 'Medium', 'Hard'],
            datasets: [{
              data: [stats.easy, stats.medium, stats.hard],
              backgroundColor: [
                'hsl(142, 76%, 36%)', // success color
                'hsl(38, 92%, 50%)',  // warning color
                'hsl(0, 84%, 60%)'    // danger color
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  font: {
                    family: 'Inter',
                    size: 12
                  }
                }
              }
            }
          }
        });
      }

      if (progressChartRef.current) {
        // Destroy existing chart if it exists
        const existingChart = Chart.getChart(progressChartRef.current);
        if (existingChart) {
          existingChart.destroy();
        }

        // Progress Line Chart (sample data for demo)
        new Chart(progressChartRef.current, {
          type: 'line',
          data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
              label: 'Problems Solved',
              data: [12, 19, 15, 25],
              borderColor: 'hsl(239, 84%, 67%)', // primary color
              backgroundColor: 'hsla(239, 84%, 67%, 0.1)',
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                  font: {
                    family: 'Inter',
                    size: 11
                  }
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  font: {
                    family: 'Inter',
                    size: 11
                  }
                }
              }
            }
          }
        });
      }
    };

    loadChartJS();
  }, [stats]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Problem Difficulty Distribution</h3>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal size={20} />
            </Button>
          </div>
          <div className="relative h-64">
            {stats && stats.total > 0 ? (
              <canvas ref={difficultyChartRef}></canvas>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-sm">No data available</p>
                  <p className="text-xs text-gray-400 mt-1">Add problems to see distribution</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Progress Over Time</h3>
            <Select defaultValue="30days">
              <SelectTrigger className="w-auto text-sm border border-gray-200 rounded-lg px-3 py-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative h-64">
            <canvas ref={progressChartRef}></canvas>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
