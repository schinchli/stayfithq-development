/**
 * Complete Health Reports Charts
 * Fixed version with proper error handling and initialization
 */

// Wait for DOM and Chart.js to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure Chart.js is fully loaded
    setTimeout(() => {
        console.log('Initializing health report charts...');
        initializeHeartRateTrends();
        initializeBloodPressureChart();
        initializeWeightBMIChart();
        initializeSleepQualityChart();
        
        // Initialize advanced charts if Plotly is available
        if (typeof Plotly !== 'undefined') {
            initializeAdvancedCharts();
        }
    }, 100);
});

// Heart Rate Trends Chart (30 Days)
function initializeHeartRateTrends() {
    const ctx = document.getElementById('heartRateTrendsChart');
    if (!ctx) {
        console.error('Heart Rate Trends chart canvas not found');
        return;
    }

    try {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Resting Heart Rate',
                    data: [72, 68, 70, 65],
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#007AFF',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }, {
                    label: 'Max Heart Rate',
                    data: [165, 170, 168, 172],
                    borderColor: '#FF3B30',
                    backgroundColor: 'rgba(255, 59, 48, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#FF3B30',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                family: 'Inter, sans-serif',
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Heart Rate Trends (30 Days)',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 50,
                        max: 180,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif'
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif'
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        console.log('Heart Rate Trends chart initialized successfully');
    } catch (error) {
        console.error('Error initializing Heart Rate Trends chart:', error);
    }
}

// Blood Pressure History Chart
function initializeBloodPressureChart() {
    const ctx = document.getElementById('bloodPressureChart');
    if (!ctx) {
        console.error('Blood Pressure chart canvas not found');
        return;
    }

    try {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Systolic',
                    data: [125, 122, 120, 118, 115, 112],
                    borderColor: '#FF3B30',
                    backgroundColor: 'rgba(255, 59, 48, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#FF3B30',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }, {
                    label: 'Diastolic',
                    data: [82, 80, 78, 76, 74, 72],
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#007AFF',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                family: 'Inter, sans-serif',
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Blood Pressure History',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 60,
                        max: 140,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif'
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif'
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        console.log('Blood Pressure chart initialized successfully');
    } catch (error) {
        console.error('Error initializing Blood Pressure chart:', error);
    }
}

// Weight & BMI Chart
function initializeWeightBMIChart() {
    const ctx = document.getElementById('weightBMIChart');
    if (!ctx) {
        console.error('Weight BMI chart canvas not found');
        return;
    }

    try {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Weight (kg)',
                    data: [75, 74, 73, 72, 71, 70],
                    borderColor: '#34C759',
                    backgroundColor: 'rgba(52, 199, 89, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#34C759',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    yAxisID: 'y'
                }, {
                    label: 'BMI',
                    data: [24.2, 23.9, 23.6, 23.3, 23.0, 22.7],
                    borderColor: '#FF9500',
                    backgroundColor: 'rgba(255, 149, 0, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#FF9500',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                family: 'Inter, sans-serif',
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Weight & BMI Tracking',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 65,
                        max: 80,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif'
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 20,
                        max: 26,
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif'
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif'
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        console.log('Weight BMI chart initialized successfully');
    } catch (error) {
        console.error('Error initializing Weight BMI chart:', error);
    }
}

// Sleep Quality Chart
function initializeSleepQualityChart() {
    const ctx = document.getElementById('sleepQualityChart');
    if (!ctx) {
        console.error('Sleep Quality chart canvas not found');
        return;
    }

    try {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Sleep Hours',
                    data: [7.5, 8.0, 7.2, 6.8, 7.8, 8.5, 8.2],
                    backgroundColor: [
                        '#007AFF',
                        '#34C759',
                        '#FF9500',
                        '#FF3B30',
                        '#AF52DE',
                        '#5AC8FA',
                        '#FFCC00'
                    ],
                    borderColor: [
                        '#007AFF',
                        '#34C759',
                        '#FF9500',
                        '#FF3B30',
                        '#AF52DE',
                        '#5AC8FA',
                        '#FFCC00'
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Sleep Quality (Hours per Night)',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif'
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: 'Inter, sans-serif'
                            }
                        }
                    }
                }
            }
        });
        console.log('Sleep Quality chart initialized successfully');
    } catch (error) {
        console.error('Error initializing Sleep Quality chart:', error);
    }
}

// Advanced charts using Plotly (if available)
function initializeAdvancedCharts() {
    // Advanced Blood Pressure Chart with Plotly
    const bpElement = document.getElementById('bpAdvancedChart');
    if (bpElement && typeof Plotly !== 'undefined') {
        try {
            const traces = [{
                x: [2023, 2024, 2025],
                y: [125, 122, 120],
                name: 'Systolic',
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#FF3B30', width: 3 },
                marker: { size: 8, color: '#FF3B30' }
            }, {
                x: [2023, 2024, 2025],
                y: [82, 80, 78],
                name: 'Diastolic',
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#007AFF', width: 3 },
                marker: { size: 8, color: '#007AFF' }
            }];
            
            const layout = {
                title: 'Advanced Blood Pressure Analysis',
                xaxis: { title: 'Year' },
                yaxis: { title: 'Blood Pressure (mmHg)' },
                font: { family: 'Inter, sans-serif' },
                plot_bgcolor: '#f8fafc',
                paper_bgcolor: 'white'
            };
            
            Plotly.newPlot('bpAdvancedChart', traces, layout, { responsive: true });
            console.log('Advanced Blood Pressure chart initialized successfully');
        } catch (error) {
            console.error('Error initializing advanced Blood Pressure chart:', error);
        }
    }
}

// Mobile menu toggle
document.getElementById('mobileMenuToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar')?.classList.toggle('show');
});
