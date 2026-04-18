// Map Module - Handles map rendering and interactions

const MapModule = (() => {
  'use strict';

  let mapInstance = null;

  /**
   * Render Map
   * @param {Array} data - Data array with location information
   * @param {Object} options - Map configuration
   */
  function renderMap(data, options = {}) {
    const defaultOptions = {
      containerId: 'map-container',
      center: [13.7563, 100.5018], // Bangkok coordinates (lat, lng)
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

      // Create simple map representation
      createSimpleMap(container, defaultOptions, data);

    } catch (error) {
      console.error('Error rendering map:', error);
    }
  }

  /**
   * Create a simple map representation (HTML + CSS + Canvas)
   * For production, replace with Leaflet, Mapbox, or Google Maps
   */
  function createSimpleMap(container, options, data) {
    container.innerHTML = '';
    
    // Create map wrapper
    const mapWrapper = document.createElement('div');
    mapWrapper.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Info box
    const infoBox = document.createElement('div');
    infoBox.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
      z-index: 10;
    `;

    infoBox.innerHTML = `
      <h3 style="color: #2196F3; margin-bottom: 10px;">Map Placeholder</h3>
      <p style="color: #666; margin: 5px 0;">Center: ${options.center[0].toFixed(4)}, ${options.center[1].toFixed(4)}</p>
      <p style="color: #666; margin: 5px 0;">Zoom: ${options.zoom}</p>
      <p style="color: #999; font-size: 12px; margin-top: 15px;">
        Integration Ready:<br>
        • Leaflet.js<br>
        • Mapbox GL<br>
        • Google Maps API
      </p>
    `;

    // Add markers
    if (data && data.length > 0) {
      const markerInfo = document.createElement('div');
      markerInfo.style.cssText = `
        margin-top: 15px;
        font-size: 12px;
        color: #666;
      `;
      markerInfo.innerHTML = `Markers Ready: ${data.length} locations`;
      infoBox.appendChild(markerInfo);
    }

    mapWrapper.appendChild(infoBox);
    container.appendChild(mapWrapper);

    // Create canvas for drawing
    const canvas = document.createElement('canvas');
    canvas.width = container.offsetWidth || 800;
    canvas.height = container.offsetHeight || 600;
    canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0.3;
    `;
    mapWrapper.insertBefore(canvas, infoBox);

    // Draw simple map representation
    drawMapOnCanvas(canvas, options, data);

    console.log('Simple map created');
  }

  /**
   * Draw map elements on canvas
   */
  function drawMapOnCanvas(canvas, options, data) {
    const ctx = canvas.getContext('2d');
    
    // Draw grid
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.2)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw random markers if data exists
    if (data && data.length > 0) {
      ctx.fillStyle = 'rgba(244, 67, 54, 0.6)';
      for (let i = 0; i < Math.min(data.length, 5); i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  /**
   * Add marker to map
   */
  function addMarker(lat, lng, options = {}) {
    if (!mapInstance) {
      console.warn('Map not initialized');
      return;
    }

    console.log(`Adding marker at ${lat}, ${lng}`);
    
    // Implementation depends on map library used
    // This is a placeholder
    return {
      id: Date.now(),
      lat,
      lng,
      ...options
    };
  }

  /**
   * Remove marker from map
   */
  function removeMarker(markerId) {
    console.log('Removing marker:', markerId);
  }

  /**
   * Set map center
   */
  function setCenter(lat, lng, zoom) {
    console.log(`Setting map center to ${lat}, ${lng} with zoom ${zoom}`);
  }

  return {
    renderMap,
    addMarker,
    removeMarker,
    setCenter,
    createSimpleMap,
    drawMapOnCanvas
  };
})();

// Export for global use
window.MapModule = MapModule;
