// Chart Module - Handle all chart rendering

const ChartModule = (() => {
  'use strict';

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

      const title = document.createElement('h3');
      title.textContent = defaultOptions.title;
      container.innerHTML = '';
      container.appendChild(title);

      const canvas = document.createElement('canvas');
      canvas.id = 'chart-canvas';
      container.appendChild(canvas);

      console.log('Chart canvas created');

    } catch (error) {
      console.error('Error rendering chart:', error);
    }
  }

  return {
    renderChart
  };
})();

window.ChartModule = ChartModule;
