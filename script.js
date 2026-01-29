// ============================================
// SMART ENERGY MANAGEMENT WITH LIVE CONTROLS
// ============================================

// Global Data Store
let monitoringData = {
    totalEnergy: 0,
    totalCost: 0,
    currentPower: 0,
    hourlyData: [],
    rooms: [],
    alerts: [],
    energySaved: 0
};

// Device Types
const DEVICES = {
    lights: { name: 'Lights', icon: '💡', power: 0.06 },
    fan: { name: 'Fan', icon: '💨', power: 0.08 },
    ac: { name: 'AC', icon: '❄️', power: 1.2 }
};

// Automation Settings
let automationSettings = {
    lightsOffTime: '22:00',
    occupancyControl: true,
    acTemp: 24
};

// Room Definitions with Devices
const ROOMS = [
    { id: 1, name: 'Classroom A', type: 'classroom', occupancy: 30, currentOccupancy: 25 },
    { id: 2, name: 'Classroom B', type: 'classroom', occupancy: 28, currentOccupancy: 20 },
    { id: 3, name: 'Computer Lab', type: 'lab', occupancy: 35, currentOccupancy: 32 },
    { id: 4, name: 'Library', type: 'library', occupancy: 25, currentOccupancy: 12 },
    { id: 5, name: 'Hostel Block A', type: 'hostel', occupancy: 50, currentOccupancy: 45 },
    { id: 6, name: 'Hostel Block B', type: 'hostel', occupancy: 45, currentOccupancy: 40 },
    { id: 7, name: 'Cafeteria', type: 'common', occupancy: 60, currentOccupancy: 35 },
    { id: 8, name: 'Office Wing', type: 'office', occupancy: 20, currentOccupancy: 18 }
];

const ENERGY_COST_PER_KWH = 7;

// Initialize hourly data
function initHourlyData() {
    for (let i = 0; i < 24; i++) {
        monitoringData.hourlyData.push({
            hour: i,
            energy: Math.random() * 50 + 30,
            cost: 0,
            timestamp: new Date(new Date().setHours(i, 0, 0, 0))
        });
    }
}

// Initialize rooms with devices
function initRooms() {
    monitoringData.rooms = ROOMS.map(room => ({
        ...room,
        currentEnergy: Math.random() * 8 + 2,
        totalEnergy: Math.random() * 200 + 50,
        costToday: 0,
        status: 'normal',
        efficiency: Math.random() * 30 + 70,
        devices: {
            lights: { status: true, power: 0 },
            fan: { status: true, power: 0 },
            ac: { status: true, power: 0 }
        },
        temperature: 25
    }));
    calculateRoomConsumption();
}

// Calculate device consumption for each room
function calculateRoomConsumption() {
    monitoringData.rooms.forEach(room => {
        let totalDevicePower = 0;
        let activeDevices = 0;

        Object.keys(room.devices).forEach(device => {
            if (room.devices[device].status) {
                const devicePower = DEVICES[device].power;
                room.devices[device].power = devicePower;
                totalDevicePower += devicePower;
                activeDevices++;
            } else {
                room.devices[device].power = 0;
            }
        });

        room.activeDevices = activeDevices;
        room.currentEnergy = totalDevicePower;
    });
}

// Apply automation rules
function applyAutomationRules() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    monitoringData.rooms.forEach(room => {
        // Time-based control: Lights off after specified time
        const [lightOffHour, lightOffMin] = automationSettings.lightsOffTime.split(':').map(Number);
        if (hours > lightOffHour || (hours === lightOffHour && minutes >= lightOffMin)) {
            if (room.devices.lights.status) {
                room.devices.lights.status = false;
            }
        }

        // Occupancy-based control
        if (automationSettings.occupancyControl && room.currentOccupancy === 0) {
            // Room empty - turn off all devices
            if (room.devices.lights.status || room.devices.fan.status || room.devices.ac.status) {
                room.devices.lights.status = false;
                room.devices.fan.status = false;
                room.devices.ac.status = false;
                monitoringData.energySaved += (DEVICES.lights.power + DEVICES.fan.power + DEVICES.ac.power) / 60;
            }
        } else if (automationSettings.occupancyControl && room.currentOccupancy > 0) {
            // Room occupied - turn on essential devices
            if (!room.devices.lights.status && hours < lightOffHour) {
                room.devices.lights.status = true;
            }
            if (!room.devices.fan.status) {
                room.devices.fan.status = true;
            }
            // AC control based on temperature
            if (room.temperature > automationSettings.acTemp) {
                room.devices.ac.status = true;
            } else if (room.temperature < automationSettings.acTemp) {
                room.devices.ac.status = false;
            }
        }
    });
}

// Toggle device in a room
window.toggleDevice = function(roomId, device) {
    const room = monitoringData.rooms.find(r => r.id === roomId);
    if (room) {
        room.devices[device].status = !room.devices[device].status;
        calculateRoomConsumption();
        updateRealtimeData();
        displayRoomCards();
    }
};

// Update real-time data
function updateRealtimeData() {
    monitoringData.currentPower = Math.random() * 80 + 40;
    
    monitoringData.totalEnergy += (monitoringData.currentPower / 60);
    monitoringData.totalCost = monitoringData.totalEnergy * ENERGY_COST_PER_KWH;
    
    // Update room data
    monitoringData.rooms.forEach(room => {
        room.totalEnergy += room.currentEnergy / 60;
        room.costToday = room.totalEnergy * ENERGY_COST_PER_KWH;
        room.temperature = 24 + Math.random() * 4;
        
        // Random occupancy fluctuation
        const occupancyChange = Math.floor(Math.random() * 5) - 2;
        room.currentOccupancy = Math.max(0, Math.min(room.occupancy, room.currentOccupancy + occupancyChange));
        
        // Determine status
        const energyPerCapita = room.totalEnergy / Math.max(1, room.currentOccupancy);
        if (energyPerCapita > 5 || room.currentEnergy > 7) {
            room.status = 'danger';
        } else if (energyPerCapita > 3 || room.currentEnergy > 5) {
            room.status = 'warning';
        } else {
            room.status = 'normal';
        }
        
        room.efficiency = Math.min(100, 50 + Math.random() * 50);
    });
    
    applyAutomationRules();
    checkForAlerts();
}

// Check for alerts
function checkForAlerts() {
    monitoringData.alerts = [];
    
    if (monitoringData.currentPower > 100) {
        monitoringData.alerts.push({
            type: 'danger',
            icon: '⚠️',
            message: `High Power: ${monitoringData.currentPower.toFixed(1)} kW`
        });
    }
    
    const dangerRooms = monitoringData.rooms.filter(r => r.status === 'danger');
    if (dangerRooms.length > 0) {
        dangerRooms.forEach(room => {
            monitoringData.alerts.push({
                type: 'danger',
                icon: '🏢',
                message: `High usage in ${room.name}: ${room.totalEnergy.toFixed(1)} kWh`
            });
        });
    }
}

// Update metrics
function updateMetrics() {
    document.getElementById('totalEnergy').innerText = monitoringData.totalEnergy.toFixed(2) + ' kWh';
    document.getElementById('totalCost').innerText = '₹' + monitoringData.totalCost.toFixed(0);
    
    document.getElementById('energyRate').innerText = `Current: ${monitoringData.currentPower.toFixed(1)} kW`;
    document.getElementById('costRate').innerText = `Rate: ₹${(monitoringData.currentPower * ENERGY_COST_PER_KWH).toFixed(0)}/hour`;
    
    const now = new Date();
    document.getElementById('lastUpdate').innerText = now.toLocaleTimeString();
    document.getElementById('currentTime').innerText = now.toLocaleTimeString();
}

// Display alerts
function displayAlerts() {
    const container = document.getElementById('alertsContainer');
    container.innerHTML = '';
    
    monitoringData.alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${alert.type}`;
        alertDiv.innerHTML = `${alert.icon} ${alert.message}`;
        container.appendChild(alertDiv);
    });
}

// Display room cards with controls
function displayRoomCards(filter = 'all') {
    const container = document.getElementById('roomsContainer');
    container.innerHTML = '';
    
    let filteredRooms = monitoringData.rooms;
    if (filter === 'high') {
        filteredRooms = monitoringData.rooms.filter(r => r.status === 'danger');
    } else if (filter === 'warning') {
        filteredRooms = monitoringData.rooms.filter(r => r.status === 'warning' || r.status === 'danger');
    }
    
    filteredRooms.forEach(room => {
        const card = document.createElement('div');
        card.className = `room-card status-${room.status}`;
        
        let deviceControls = '';
        Object.keys(room.devices).forEach(device => {
            const isActive = room.devices[device].status;
            deviceControls += `
                <div class="device-control">
                    <button class="device-btn ${isActive ? 'active' : ''}" 
                            onclick="toggleDevice(${room.id}, '${device}')">
                        ${DEVICES[device].icon} ${DEVICES[device].name}
                    </button>
                </div>
            `;
        });
        
        card.innerHTML = `
            <h3>${room.name}</h3>
            <div class="room-data">
                <div class="data-item">
                    <span class="label">👥 Occupancy:</span>
                    <span class="value">${room.currentOccupancy}/${room.occupancy}</span>
                </div>
                <div class="data-item">
                    <span class="label">🌡️ Temperature:</span>
                    <span class="value">${room.temperature.toFixed(1)}°C</span>
                </div>
                <div class="data-item">
                    <span class="label">⚡ Current:</span>
                    <span class="value">${room.currentEnergy.toFixed(2)} kW</span>
                </div>
                <div class="data-item">
                    <span class="label">📊 Today:</span>
                    <span class="value">${room.totalEnergy.toFixed(1)} kWh</span>
                </div>
                <div class="data-item">
                    <span class="label">💰 Cost:</span>
                    <span class="value">₹${room.costToday.toFixed(0)}</span>
                </div>
                <div class="devices-section">
                    <h4>🎛️ Device Controls</h4>
                    <div class="devices-grid">
                        ${deviceControls}
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Update analytics table
function updateAnalyticsTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    monitoringData.rooms.forEach(room => {
        const activeDevices = Object.values(room.devices).filter(d => d.status).length;
        const row = document.createElement('tr');
        row.className = `status-${room.status}`;
        row.innerHTML = `
            <td>${room.name}</td>
            <td>${room.currentOccupancy}/${room.occupancy}</td>
            <td>${room.totalEnergy.toFixed(2)}</td>
            <td>₹${room.costToday.toFixed(0)}</td>
            <td>${activeDevices}/3</td>
            <td class="status-badge">${room.status.toUpperCase()}</td>
        `;
        tbody.appendChild(row);
    });
}

// Charts
let energyChart, costChart;

function initializeCharts() {
    // Energy Chart
    const ctx1 = document.getElementById('energyChart').getContext('2d');
    energyChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: monitoringData.hourlyData.map(d => d.hour + ':00'),
            datasets: [{
                label: 'Energy (kWh)',
                data: monitoringData.hourlyData.map(d => d.energy),
                borderColor: '#1e88e5',
                backgroundColor: 'rgba(30, 136, 229, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true, max: 100 } } }
    });

    // Cost Chart
    const ctx3 = document.getElementById('costChart').getContext('2d');
    costChart = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: monitoringData.hourlyData.map(d => d.hour + ':00'),
            datasets: [{
                label: 'Cost (₹)',
                data: monitoringData.hourlyData.map(d => (d.energy * ENERGY_COST_PER_KWH) / 24),
                backgroundColor: 'rgba(76, 175, 80, 0.7)',
                borderColor: '#4caf50',
                borderWidth: 1
            }]
        },
        options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true } } }
    });
}

function updateCharts() {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (monitoringData.hourlyData[currentHour]) {
        monitoringData.hourlyData[currentHour].energy = monitoringData.currentPower * 0.6;
    }
    
    energyChart.data.datasets[0].data = monitoringData.hourlyData.map(d => d.energy);
    costChart.data.datasets[0].data = monitoringData.hourlyData.map(d => (d.energy * ENERGY_COST_PER_KWH) / 24);
    
    energyChart.update();
    costChart.update();
}

// Update statistics
function updateStatistics() {
    const peakHour = monitoringData.hourlyData.reduce((max, d) => d.energy > max.energy ? d : max);
    const lowHour = monitoringData.hourlyData.reduce((min, d) => d.energy < min.energy ? d : min);
    
    document.getElementById('peakTime').innerText = peakHour.hour + ':00';
    document.getElementById('lowTime').innerText = lowHour.hour + ':00';
    document.getElementById('energySaved').innerText = monitoringData.energySaved.toFixed(2) + ' kWh';
}

// Load settings from input
function loadSettings() {
    const lightsOffTime = document.getElementById('lightsOffTime');
    const occupancyControl = document.getElementById('occupancyControl');
    const acTemp = document.getElementById('acTemp');
    
    if (lightsOffTime) lightsOffTime.addEventListener('change', function() { automationSettings.lightsOffTime = this.value; });
    if (occupancyControl) occupancyControl.addEventListener('change', function() { automationSettings.occupancyControl = this.checked; });
    if (acTemp) acTemp.addEventListener('change', function() { automationSettings.acTemp = parseInt(this.value); });
}

// Global filter
window.filterRooms = function(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    displayRoomCards(filter);
};

// Initialize
function initializeMonitoring() {
    initHourlyData();
    initRooms();
    loadSettings();
    initializeCharts();
    
    updateRealtimeData();
    updateMetrics();
    displayAlerts();
    displayRoomCards();
    updateAnalyticsTable();
    updateStatistics();
    
    setInterval(() => {
        updateRealtimeData();
        updateMetrics();
        displayAlerts();
        displayRoomCards();
        updateAnalyticsTable();
        updateCharts();
        updateStatistics();
    }, 5000);
}

window.addEventListener('DOMContentLoaded', initializeMonitoring);
