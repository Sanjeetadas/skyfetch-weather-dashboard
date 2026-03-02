function WeatherApp(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

    this.searchBtn = document.getElementById('search-btn');
    this.cityInput = document.getElementById('city-input');
    this.weatherDisplay = document.getElementById('weather-display')
    this.recentSearchesSection = document.getElementById('recent-searches-section');
    this.recentSearchesContainer = document.getElementById('recent-searches-container');

    this.recentSearches = [];
    this.maxRecentSearches = 5;

    this.init();
}

WeatherApp.prototype.loadRecentSearches = function() {
    const saved = localStorage.getItem('recentSearches');
    
    if (saved) {
        this.recentSearches = JSON.parse(saved);
    }
    
    this.displayRecentSearches();
};

WeatherApp.prototype.saveRecentSearch = function(city) {
    const cityName = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

    const index = this.recentSearches.indexOf(cityName);
    if (index > -1) {
        this.recentSearches.splice(index, 1);
    }

    this.recentSearches.unshift(cityName);

    if (this.recentSearches.length > this.maxRecentSearches) {
        this.recentSearches.pop();
    }

    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));

    this.displayRecentSearches();
};

WeatherApp.prototype.displayRecentSearches = function() {
    this.recentSearchesContainer.innerHTML = '';

    if (this.recentSearches.length === 0) {
        this.recentSearchesSection.style.display = 'none';
        return;
    }

    this.recentSearchesSection.style.display = 'block';

    this.recentSearches.forEach(function(city) {
        const btn = document.createElement('button');
        btn.className = 'recent-search-btn';
        btn.textContent = city;

        btn.addEventListener('click', function() {
            this.cityInput.value = city;
            this.getWeather(city);
        }.bind(this));

        this.recentSearchesContainer.appendChild(btn);
    }.bind(this));
};

WeatherApp.prototype.loadLastCity = function() {
    const lastCity = localStorage.getItem('lastCity');

    if (lastCity) {
        this.getWeather(lastCity);
    } else {
        this.showWelcome();
    }
};

WeatherApp.prototype.clearHistory = function() {
    if (confirm('Clear all recent searches?')) {
        this.recentSearches = [];
        localStorage.removeItem('recentSearches');
        this.displayRecentSearches();
    }
};
// Initialize
WeatherApp.prototype.init = function () {
    this.searchBtn.addEventListener(
        'click',
        this.handleSearch.bind(this)
    );

    this.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            this.handleSearch();
        }
    });

    this.showWelcome();
    this.loadRecentSearches();
    this.loadLastCity();

    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', this.clearHistory.bind(this));
    }
};

// Welcome Screen
WeatherApp.prototype.showWelcome = function () {
    this.weatherDisplay.innerHTML = `
        <div class="welcome-message">
            🌍 Enter a city name to get started!
        </div>
    `;
};

// Handle Search
WeatherApp.prototype.handleSearch = function () {
    const city = this.cityInput.value.trim();

    if (!city) {
        this.showError("Please enter a city name.");
        return;
    }

    if (city.length < 2) {
        this.showError("City name must be at least 2 characters.");
        return;
    }

    this.getWeather(city);
    this.cityInput.value = "";
};

// Fetch Forecast
WeatherApp.prototype.getForecast = async function (city) {
    const url = `${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`;

    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Fetch Current + Forecast
WeatherApp.prototype.getWeather = async function (city) {
    this.showLoading();
    this.searchBtn.disabled = true;
    this.searchBtn.textContent = "Searching...";

    const currentWeatherUrl =
        `${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`;

    try {
        const [currentWeather, forecastData] = await Promise.all([
            axios.get(currentWeatherUrl),
            this.getForecast(city)
        ]);

        this.displayWeather(currentWeather.data);
        this.displayForecast(forecastData);
        this.saveRecentSearch(city);
        localStorage.setItem('lastCity', city);

    } catch (error) {
        if (error.response && error.response.status === 404) {
            this.showError("City not found. Please check spelling.");
        } else {
            this.showError("Something went wrong. Please try again.");
        }
    } finally {
        this.searchBtn.disabled = false;
        this.searchBtn.textContent = "Search";
    }
};

// Display Current Weather
WeatherApp.prototype.displayWeather = function (data) {
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl =
        `https://openweathermap.org/img/wn/${icon}@2x.png`;

    this.weatherDisplay.innerHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <div class="temperature">${temperature}°C</div>
            <p class="description">${description}</p>
        </div>
    `;
};

// Process Forecast (40 → 5)
WeatherApp.prototype.processForecastData = function (data) {
    const dailyForecasts = data.list.filter(function (item) {
        return item.dt_txt.includes("12:00:00");
    });

    return dailyForecasts.slice(0, 5);
};

// Display Forecast
WeatherApp.prototype.displayForecast = function (data) {
    const dailyForecasts = this.processForecastData(data);

    const forecastHTML = dailyForecasts.map(function (day) {
        const date = new Date(day.dt * 1000);
        const dayName =
            date.toLocaleDateString("en-US", { weekday: "short" });

        const temp = Math.round(day.main.temp);
        const description = day.weather[0].description;
        const icon = day.weather[0].icon;
        const iconUrl =
            `https://openweathermap.org/img/wn/${icon}@2x.png`;

        return `
            <div class="forecast-card">
                <h4>${dayName}</h4>
                <img src="${iconUrl}" alt="${description}">
                <p>${temp}°C</p>
                <small>${description}</small>
            </div>
        `;
    }).join("");

    const forecastSection = `
        <div class="forecast-section">
            <h3>5-Day Forecast</h3>
            <div class="forecast-container">
                ${forecastHTML}
            </div>
        </div>
    `;

    this.weatherDisplay.innerHTML += forecastSection;
};

// Loading
WeatherApp.prototype.showLoading = function () {
    this.weatherDisplay.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;
};

// Error
WeatherApp.prototype.showError = function (message) {
    this.weatherDisplay.innerHTML = `
        <div class="error-message">
            ❌ ${message}
        </div>
    `;
};

// Create App Instance
const app = new WeatherApp('6156bee86a50996aecb7a61b2466b104');