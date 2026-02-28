// Your OpenWeatherMap API Key
const API_KEY = '6156bee86a50996aecb7a61b2466b104';  // Replace with your actual API key
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Function to fetch weather data
async function getWeather(city) {
    showLoading();

    const url = `${API_URL}?q=${city}&appid=${API_KEY}&units=metric`;

    try {
        const response = await axios.get(url);
        displayWeather(response.data);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            showError("City not found. Please check spelling.");
        } else {
            showError("Something went wrong. Try again later.");
        }
    }
}

// Function to display weather data
function displayWeather(data) {
    // Extract the data we need
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    
    // Create HTML to display
    const weatherHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <div class="temperature">${temperature}°C</div>
            <p class="description">${description}</p>
        </div>
    `;
    
    // Put it on the page
    document.getElementById('weather-display').innerHTML = weatherHTML;
}

function showError(message) {
    const errorHTML = `
        <div class="error-message">
            ❌ ${message}
        </div>
    `;
    document.getElementById('weather-display').innerHTML = errorHTML;
}

function showLoading() {
    const loadingHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;
    document.getElementById('weather-display').innerHTML = loadingHTML;
}

const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');

searchBtn.addEventListener('click', function () {
    const city = cityInput.value.trim();

    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    getWeather(city);
    cityInput.value = "";
});

cityInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        searchBtn.click();
    }
});

document.getElementById('weather-display').innerHTML = `
    <div class="welcome-message">
        🌍 Enter a city name to get started!
    </div>
`;