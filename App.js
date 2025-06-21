// Weather App JavaScript

class WeatherApp {
    constructor() {
        this.currentUnit = 'C';
        this.currentData = null;
        this.defaultLocation = {
            name: "London",
            latitude: 51.5074,
            longitude: -0.1278,
            country: "United Kingdom"
        };
        
        this.weatherCodes = {
            "0": { "description": "Clear sky", "icon": "☀️" },
            "1": { "description": "Mainly clear", "icon": "🌤️" },
            "2": { "description": "Partly cloudy", "icon": "⛅" },
            "3": { "description": "Overcast", "icon": "☁️" },
            "45": { "description": "Fog", "icon": "🌫️" },
            "48": { "description": "Depositing rime fog", "icon": "🌫️" },
            "51": { "description": "Light drizzle", "icon": "🌦️" },
            "53": { "description": "Moderate drizzle", "icon": "🌦️" },
            "55": { "description": "Dense drizzle", "icon": "🌦️" },
            "61": { "description": "Light rain", "icon": "🌧️" },
            "63": { "description": "Moderate rain", "icon": "🌧️" },
            "65": { "description": "Heavy rain", "icon": "🌧️" },
            "71": { "description": "Light snow", "icon": "🌨️" },
            "73": { "description": "Moderate snow", "icon": "🌨️" },
            "75": { "description": "Heavy snow", "icon": "🌨️" },
            "95": { "description": "Thunderstorm", "icon": "⛈️" }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDateTime();
        this.loadWeatherData(this.defaultLocation);
        
        // Update time every minute
        setInterval(() => this.updateDateTime(), 60000);
    }

    bindEvents() {
        // Search form
        document.getElementById('searchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Location button
        document.getElementById('locationBtn').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // Temperature unit toggle
        document.querySelectorAll('.temp-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toggleTemperatureUnit(e.target.dataset.unit);
            });
        });

        // Retry button
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.loadWeatherData(this.defaultLocation);
        });
    }

    updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
    }

    async handleSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;

        try {
            this.showLoading();
            const location = await this.geocodeLocation(query);
            await this.loadWeatherData(location);
            document.getElementById('searchInput').value = '';
        } catch (error) {
            this.showError('Location not found. Please try a different city name.');
        }
    }

    async geocodeLocation(query) {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            throw new Error('Location not found');
        }

        const result = data.results[0];
        return {
            name: result.name,
            latitude: result.latitude,
            longitude: result.longitude,
            country: result.country || ''
        };
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showTemporaryMessage('Geolocation is not supported by this browser.');
            return;
        }

        // Update button text to show loading
        const locationBtn = document.getElementById('locationBtn');
        const originalText = locationBtn.textContent;
        locationBtn.textContent = '🔄 Getting location...';
        locationBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const location = await this.reverseGeocode(
                        position.coords.latitude, 
                        position.coords.longitude
                    );
                    await this.loadWeatherData(location);
                    this.showTemporaryMessage('Location updated successfully!', 'success');
                } catch (error) {
                    this.showTemporaryMessage('Failed to get location information.');
                } finally {
                    locationBtn.textContent = originalText;
                    locationBtn.disabled = false;
                }
            },
            (error) => {
                let message = 'Unable to access your location.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location access denied. Please enable location permissions in your browser.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out.';
                        break;
                }
                this.showTemporaryMessage(message);
                locationBtn.textContent = originalText;
                locationBtn.disabled = false;
            },
            {
                timeout: 10000,
                enableHighAccuracy: true,
                maximumAge: 300000
            }
        );
    }

    showTemporaryMessage(message, type = 'info') {
        // Create temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `status status--${type}`;
        messageEl.textContent = message;
        messageEl.style.position = 'fixed';
        messageEl.style.top = '20px';
        messageEl.style.right = '20px';
        messageEl.style.zIndex = '1000';
        messageEl.style.animation = 'slideIn 0.3s ease-out';
        
        document.body.appendChild(messageEl);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    async reverseGeocode(lat, lon) {
        try {
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                return {
                    name: result.name,
                    latitude: lat,
                    longitude: lon,
                    country: result.country || ''
                };
            }
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
        }
        
        return {
            name: 'Current Location',
            latitude: lat,
            longitude: lon,
            country: ''
        };
    }

    async loadWeatherData(location) {
        try {
            this.showLoading();
            
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto`;
            
            const response = await fetch(weatherUrl);
            if (!response.ok) {
                throw new Error('Weather data unavailable');
            }
            
            const data = await response.json();
            this.currentData = { ...data, location };
            this.updateUI(this.currentData);
            this.hideLoading();
            
        } catch (error) {
            console.error('Weather API Error:', error);
            this.showError('Failed to load weather data. Please check your internet connection and try again.');
        }
    }

    updateUI(data) {
        const { current, hourly, daily, location } = data;
        
        // Update location
        const locationText = location.country ? 
            `${location.name}, ${location.country}` : 
            location.name;
        document.getElementById('currentLocation').textContent = locationText;
        
        // Update current time for location
        const now = new Date();
        const timeOptions = { 
            weekday: 'long',
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: data.timezone || 'auto'
        };
        document.getElementById('currentTime').textContent = now.toLocaleDateString('en-US', timeOptions);
        
        // Update current weather
        this.updateCurrentWeather(current);
        
        // Update hourly forecast
        this.updateHourlyForecast(hourly);
        
        // Update daily forecast
        this.updateDailyForecast(daily);
        
        // Update sun times
        this.updateSunTimes(daily);
    }

    updateCurrentWeather(current) {
        const temp = this.convertTemperature(current.temperature_2m);
        const feelsLike = this.convertTemperature(current.apparent_temperature);
        
        document.getElementById('mainTemperature').textContent = `${Math.round(temp)}°`;
        document.getElementById('feelsLike').textContent = `${Math.round(feelsLike)}°`;
        
        // Weather condition
        const weatherInfo = this.weatherCodes[current.weather_code] || this.weatherCodes["1"];
        document.getElementById('mainWeatherIcon').textContent = weatherInfo.icon;
        document.getElementById('weatherDescription').textContent = weatherInfo.description;
        
        // Weather details
        document.getElementById('windInfo').textContent = `${Math.round(current.wind_speed_10m)} km/h ${this.getWindDirection(current.wind_direction_10m)}`;
        document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
        document.getElementById('pressure').textContent = `${Math.round(current.pressure_msl)} hPa`;
        document.getElementById('visibility').textContent = `10 km`; // Not provided by API
        document.getElementById('uvIndex').textContent = `4`; // Not provided by API
        document.getElementById('cloudCover').textContent = `${current.cloud_cover}%`;
    }

    updateHourlyForecast(hourly) {
        const container = document.getElementById('hourlyForecast');
        container.innerHTML = '';
        
        // Show next 24 hours
        for (let i = 0; i < Math.min(24, hourly.time.length); i++) {
            const time = new Date(hourly.time[i]);
            const temp = this.convertTemperature(hourly.temperature_2m[i]);
            const weatherInfo = this.weatherCodes[hourly.weather_code[i]] || this.weatherCodes["1"];
            const precipitation = hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0;
            
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item';
            hourlyItem.innerHTML = `
                <div class="hourly-time">${time.getHours()}:00</div>
                <div class="hourly-icon">${weatherInfo.icon}</div>
                <div class="hourly-temp">${Math.round(temp)}°</div>
                <div class="hourly-rain">${precipitation}%</div>
            `;
            container.appendChild(hourlyItem);
        }
    }

    updateDailyForecast(daily) {
        const container = document.getElementById('dailyForecast');
        container.innerHTML = '';
        
        const days = ['Today', 'Tomorrow'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (let i = 0; i < Math.min(7, daily.time.length); i++) {
            const date = new Date(daily.time[i]);
            const high = this.convertTemperature(daily.temperature_2m_max[i]);
            const low = this.convertTemperature(daily.temperature_2m_min[i]);
            const weatherInfo = this.weatherCodes[daily.weather_code[i]] || this.weatherCodes["1"];
            const precipitation = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;
            
            let dayName;
            if (i < days.length) {
                dayName = days[i];
            } else {
                dayName = dayNames[date.getDay()];
            }
            
            const dailyItem = document.createElement('div');
            dailyItem.className = 'daily-item';
            dailyItem.innerHTML = `
                <div class="daily-day">${dayName}</div>
                <div class="daily-icon">${weatherInfo.icon}</div>
                <div class="daily-temps">
                    <span class="daily-high">${Math.round(high)}°</span>
                    <span class="daily-low">${Math.round(low)}°</span>
                </div>
                <div class="daily-rain">${precipitation}%</div>
            `;
            container.appendChild(dailyItem);
        }
    }

    updateSunTimes(daily) {
        if (daily.sunrise && daily.sunset) {
            const sunrise = new Date(daily.sunrise[0]);
            const sunset = new Date(daily.sunset[0]);
            
            document.getElementById('sunrise').textContent = sunrise.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            
            document.getElementById('sunset').textContent = sunset.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
    }

    toggleTemperatureUnit(unit) {
        if (this.currentUnit === unit) return;
        
        this.currentUnit = unit;
        
        // Update toggle buttons
        document.querySelectorAll('.temp-toggle').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === unit);
        });
        
        // Re-render temperatures if data exists
        if (this.currentData) {
            this.updateCurrentWeather(this.currentData.current);
            this.updateHourlyForecast(this.currentData.hourly);
            this.updateDailyForecast(this.currentData.daily);
        }
    }

    convertTemperature(celsius) {
        return this.currentUnit === 'F' ? (celsius * 9/5) + 32 : celsius;
    }

    getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    showLoading() {
        document.getElementById('loadingState').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('errorMessage').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('errorMessage').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('errorMessage').classList.remove('hidden');
        document.getElementById('errorText').textContent = message;
    }
}

// Add CSS for temporary message animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});
