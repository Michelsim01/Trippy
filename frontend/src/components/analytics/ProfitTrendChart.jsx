import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

/**
 * ProfitTrendChart Component
 * Displays a line chart showing profit trends over time
 *
 * @param {Array} data - Array of objects with { month, profit } structure
 * @param {string} title - Chart title
 */
const ProfitTrendChart = ({ data = [], title = "Monthly Profit Trend" }) => {
    // Prepare chart data
    const chartData = {
        labels: data.map(item => item.month),
        datasets: [
            {
                label: 'Profit ($)',
                data: data.map(item => item.profit),
                borderColor: 'rgb(99, 102, 241)', // Indigo color
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4, // Smooth line
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgb(99, 102, 241)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            }
        ]
    };

    // Chart configuration options
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    size: 14,
                    weight: 'bold'
                },
                bodyFont: {
                    size: 13
                },
                callbacks: {
                    label: function(context) {
                        return `Profit: $${context.parsed.y.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '$' + value;
                    },
                    font: {
                        size: 12
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                }
            },
            x: {
                ticks: {
                    font: {
                        size: 12
                    }
                },
                grid: {
                    display: false
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg border border-neutrals-6 shadow-sm">
            <h3 className="text-lg font-semibold text-neutrals-1 mb-4">{title}</h3>
            <div className="h-[300px]">
                {data.length > 0 ? (
                    <Line data={chartData} options={options} />
                ) : (
                    <div className="flex items-center justify-center h-full text-neutrals-4">
                        <p>No profit data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfitTrendChart;
