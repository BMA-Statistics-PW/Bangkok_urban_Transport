// Chart Module - Handles all chart rendering and interactions

const ChartModule = (() => {
  'use strict';

  // Chart state
  let chartInstance = null;
  const charts = {};

  /**
   * Render Chart
   * @param {Array} data - Data array for chart
   * @param {Object} options - Chart configuration
   */
  function renderChart(data, options = {}) {
    const defaultOptions = {
      type: 'bar',
      containerId: 'chart-container',
      title: 'Data Chart',
      ...options
    };

    try {
      console.log('Rendering chart:', defaultOptions.type);
      
      const container = document.getElementById(defaultOptions.containerId);
      if (!container) {
        console.warn(`Container #${defaultOptions.containerId} not found`);
        return;
      }

      // Clear previous chart
      container.innerHTML = '';

      // Add title
      const title = document.createElement('h3');
      title.textContent = defaultOptions.title;
      title.style.marginBottom = '15px';
      container.appendChild(title);

      // Create canvas for chart
      const canvas = document.createElement('canvas');
      canvas.id = 'chart-canvas';
      container.appendChild(canvas);

      // Prepare chart data
      const chartData = prepareChartData(data, defaultOptions);
      
      // Render based on type
      switch(defaultOptions.type) {
        case 'bar':
          renderBarChart(canvas, chartData);
          break;
        case 'line':
          renderLineChart(canvas, chartData);
          break;
        case 'pie':
          renderPieChart(canvas, chartData);
          break;
        default:
          renderSimpleChart(canvas, chartData);
      }

    } catch (error) {
      console.error('Error rendering chart:', error);
    }
  }

  /**
   * Prepare data for charting
   */
  function prepareChartData(data, options) {
    if (!data || data.length === 0) {
      return { labels: [], values: [] };
    }

    const labels = data.map((_, i) => `Item ${i + 1}`);
    const values = data.map(() => Math.random() * 100);

    return { labels, values };
  }

  /**
   * Render Bar Chart (simple SVG version without dependencies)
   */
  function renderBarChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const padding = 40;
    const barWidth = (canvas.width - 2 * padding) / data.labels.length;
    const maxValue = Math.max(...data.values);
    
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw bars
    ctx.fillStyle = '#2196F3';
    data.values.forEach((value, i) => {
      const barHeight = (value / maxValue) * (canvas.height - 2 * padding);
      const x = padding + i * barWidth;
      const y = canvas.height - padding - barHeight;
      ctx.fillRect(x, y, barWidth * 0.8, barHeight);
    });
    
    console.log('Bar chart rendered');
  }

  /**
   * Render Line Chart (simple SVG version)
   */
  function renderLineChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const padding = 40;
    const pointSpacing = (canvas.width - 2 * padding) / (data.labels.length - 1 || 1);
    const maxValue = Math.max(...data.values);
    
    data.values.forEach((value, i) => {
      const x = padding + i * pointSpacing;
      const y = canvas.height - padding - (value / maxValue) * (canvas.height - 2 * padding);
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
    console.log('Line chart rendered');
  }

  /**
   * Render Pie Chart (simple SVG version)
   */
  function renderPieChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    const total = data.values.reduce((a, b) => a + b, 0);
    
    const colors = ['#2196F3', '#FF9800', '#4CAF50', '#F44336'];
    let currentAngle = 0;
    
    data.values.forEach((value, i) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      
      currentAngle += sliceAngle;
    });
    
    console.log('Pie chart rendered');
  }

  /**
   * Simple fallback chart render
   */
  function renderSimpleChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2196F3';
    ctx.font = '16px Arial';
    ctx.fillText('Chart: ' + data.labels.length + ' items', 20, 50);
  }

  return {
    renderChart,
    prepareChartData,
    renderBarChart,
    renderLineChart,
    renderPieChart
  };
})();

// Export for global use
window.ChartModule = ChartModule;
