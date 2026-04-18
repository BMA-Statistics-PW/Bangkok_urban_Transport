// Main Dashboard Logic

class Dashboard {
  constructor(configPath = 'config/config.json') {
    this.config = null;
    this.data = null;
    this.init(configPath);
  }

  // Initialize Dashboard
  async init(configPath) {
    try {
      console.log('Initializing Dashboard...');
      
      // Load configuration
      this.config = await this.loadConfig(configPath);
      console.log('Config loaded:', this.config);
      
      // Load data
      this.data = await this.loadData(this.config.dataPath);
      console.log('Data loaded:', this.data);
      
      // Initialize components
      this.initializeComponents();
      
      console.log('Dashboard initialized successfully');
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      this.showError('Failed to initialize dashboard');
    }
  }

  // Load Configuration
  async loadConfig(configPath) {
    const response = await fetch(configPath);
    if (!response.ok) throw new Error('Failed to load config');
    return await response.json();
  }

  // Load Data
  async loadData(dataPath) {
    const response = await fetch(dataPath);
    if (!response.ok) throw new Error('Failed to load data');
    const text = await response.text();
    return this.parseCSV(text);
  }

  // Parse CSV Data
  parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index].trim();
      });
      return obj;
    });
    return data;
  }

  // Initialize all components
  initializeComponents() {
    if (this.config.chartEnabled) {
      this.initChart();
    }
    if (this.config.mapEnabled) {
      this.initMap();
    }
    this.updateStats();
  }

  // Initialize Chart
  initChart() {
    console.log('Initializing chart...');
    // Chart logic delegated to chart.js
    if (window.ChartModule) {
      window.ChartModule.renderChart(this.data);
    }
  }

  // Initialize Map
  initMap() {
    console.log('Initializing map...');
    // Map logic delegated to map.js
    if (window.MapModule) {
      window.MapModule.renderMap(this.data);
    }
  }

  // Update Statistics
  updateStats() {
    const stats = this.calculateStats();
    this.displayStats(stats);
  }

  // Calculate Statistics from data
  calculateStats() {
    if (!this.data || this.data.length === 0) return {};
    
    return {
      total: this.data.length,
      timestamp: new Date().toLocaleString()
    };
  }

  // Display Statistics
  displayStats(stats) {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;
    
    let html = '';
    for (const [key, value] of Object.entries(stats)) {
      html += `
        <div class="stat-box">
          <div>
            <div class="label">${key}</div>
            <div class="value">${value}</div>
          </div>
        </div>
      `;
    }
    statsContainer.innerHTML = html;
  }

  // Error Handling
  showError(message) {
    console.error(message);
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.innerHTML = `<div style="color: red; padding: 10px; background: #ffebee; border-radius: 4px;">${message}</div>`;
    }
  }

  // Refresh Data
  async refresh() {
    try {
      this.data = await this.loadData(this.config.dataPath);
      this.initializeComponents();
      console.log('Dashboard refreshed');
    } catch (error) {
      this.showError('Failed to refresh dashboard');
    }
  }
}

// Initialize Dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
  
  // Auto-refresh if enabled
  if (window.dashboardConfig && window.dashboardConfig.autoRefreshInterval) {
    setInterval(() => {
      window.dashboard?.refresh();
    }, window.dashboardConfig.autoRefreshInterval);
  }
});
