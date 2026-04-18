// Map Module - Handle all map rendering

const MapModule = (() => {
  'use strict';

  function renderMap(data, options = {}) {
    const defaultOptions = {
      containerId: 'map-container',
      center: [13.7563, 100.5018],
      zoom: 12,
      ...options
    };

    try {
      console.log('Rendering map...');
      
      const container = document.getElementById(defaultOptions.containerId);
      if (!container) {
        console.warn(`Container #${defaultOptions.containerId} not found`);
        return;
      }

      const title = document.createElement('h3');
      title.textContent = 'Map View';
      
      const info = document.createElement('p');
      info.textContent = `Center: ${defaultOptions.center[0]}, ${defaultOptions.center[1]} | Zoom: ${defaultOptions.zoom}`;
      
      container.innerHTML = '';
      container.appendChild(title);
      container.appendChild(info);

      console.log('Map initialized');

    } catch (error) {
      console.error('Error rendering map:', error);
    }
  }

  return {
    renderMap
  };
})();

window.MapModule = MapModule;
