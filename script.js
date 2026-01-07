document.addEventListener('DOMContentLoaded', function () {
  // This function runs when the entire HTML document is fully loaded

  // Get DOM elements by their IDs
  const cityInput =document.getElementById('city-input');
  const searchBtn =document.getElementById('search-btn');
  const locationBtn =document.getElementById('location-btn');
  const cityName = document.getElementById('city-name');
  const currentTemp =document.getElementById('current-temp');
  const weatherDescription = document.getElementById('weather-description');
  const weatherIcon = document.getElementById('weather-icon');
  const feelsLike = document.getElementById('feels-like');
  const humidity = document.getElementById('humidity');
  const windSpeed =document.getElementById('wind-speed');
  const pressure =document.getElementById('pressure');
  const forecastContainer = document.getElementById('forecast');
  const lastUpdated = document.getElementById('last-updated');
  const celsiusBtn = document.getElementById('celsius');
  const fahrenheitBtn = document.getElementById('fahrenheit');

  // OpenWeatherMap API key 
  const apiKey = '9110aabf25fb89d0802c4f270ab44ee1';

  // Default unit system: metric (Celsius)
  let currentUnit = 'metric';

  // Eventlistener for search button click
  searchBtn.addEventListener('click', fetchWeather);

  // Event listener for location button click (to get weather by current location)
  locationBtn.addEventListener('click', getLocationWeather);

  // Event listener for Enter key press in city input to trigger search
  cityInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      fetchWeather();
    }
  });
  // Event listener for Celsius button to switch units
  celsiusBtn.addEventListener('click', function () {
    if (!celsiusBtn.classList.contains('active')) {
      toggleUnit('celsius');
    }
  });

  // Event listener for Fahrenheit button to switch units
  fahrenheitBtn.addEventListener('click', function () {
    if (!fahrenheitBtn.classList.contains('active')) {
      toggleUnit('fahrenheit');
    }
  });

  // Fetch weather data using city name input
  function fetchWeather() {
    const city = cityInput.value.trim(); // Get the city name entered by user
    if (city === '') {
      showError('Please enter a city name');
      return;
    }

    // Prepare API URLs for current weather and forecast
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${currentUnit}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${currentUnit}`;

    showLoading(); // Show loading state
    clearError();  // Clear previous errors

    // Fetch current weather data
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('City not found');
        }
        return response.json();
      })
      .then(data => {
        displayWeather(data); // Display current weather data
        return fetch(forecastUrl); // Then fetch forecast data
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Forecast not available');
        }
        return response.json();
      })
      .then(data => {
        displayForecast(data); // Display forecast data
        hideLoading();         // Hide loading state
        updateLastUpdated();   // Update last updated time display
      })
      .catch(error => {
        showError(error.message); // Show any error message
        hideLoading();
      });
  }

  // Get weather data based on user's current geographical location
  function getLocationWeather() {
    if (navigator.geolocation) {
      showLoading();
      clearError();
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Prepare API URLs with latitude and longitude
          const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit}`;
          const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit}`;

          // Fetch current weather based on location
          fetch(apiUrl)
            .then(response => {
              if (!response.ok) {
                throw new Error('Location weather not available');
              }
              return response.json();
            })
            .then(data => {
              displayWeather(data); // Display current weather data
              cityInput.value = data.name; // Update city input with located city name
              return fetch(forecastUrl); // Then fetch forecast data
            })
            .then(response => {
              if (!response.ok) {
                throw new Error('Forecast not available');
              }
              return response.json();
            })
            .then(data => {
              displayForecast(data); // Display forecast data
              hideLoading();
              updateLastUpdated();
            })
            .catch(error => {
              showError(error.message);
              hideLoading();
            });
        },
        error => {
          showError('Geolocation is not supported or permission denied');
          hideLoading();
        }
      );
    } else {
      showError('Geolocation is not supported by your browser');
    }
  }

  // Display current weather details on the page
  function displayWeather(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    currentTemp.textContent = Math.round(data.main.temp);
    weatherDescription.textContent = data.weather[0].description;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description;

    // Units depending on selected metric/imperial
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    const speedUnit = currentUnit === 'metric' ? 'km/h' : 'mph';

    feelsLike.textContent = `${Math.round(data.main.feels_like)}${tempUnit}`;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${currentUnit === 'metric' ? Math.round(data.wind.speed * 3.6) : Math.round(data.wind.speed)} ${speedUnit}`;
    pressure.textContent = `${data.main.pressure} hPa`;
  }

  // Display 5-day weather forecast on the page
  function displayForecast(data) {
    forecastContainer.innerHTML = ''; // Clear any previous forecast

    const dailyForecasts = [];
    const days = {};

    // Loop through forecast data to get one forecast per day (near midday)
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });

      // Only take forecast between 11am and 2pm for each day
      if (date.getHours() >= 11 && date.getHours() <= 14 && !days[day]) {
        days[day] = true;
        dailyForecasts.push({
          day: day,
          temp: Math.round(item.main.temp),
          feels_like: Math.round(item.main.feels_like),
          icon: item.weather[0].icon,
          description: item.weather[0].description
        });
      }
    });

    // Show forecast for next 5 days
    dailyForecasts.slice(0, 5).forEach(forecast => {
      const forecastItem = document.createElement('div');
      forecastItem.className = 'forecast-item';

      forecastItem.innerHTML = `
              <div class="forecast-day">${forecast.day}</div>
              <div class="forecast-icon">
                  <img src="https://openweathermap.org/img/wn/${forecast.icon}.png" alt="${forecast.description}">
              </div>
              <div class="forecast-temp">
                  <span>${forecast.temp}°</span>
                  <span>${forecast.feels_like}°</span>
              </div>
          `;

      forecastContainer.appendChild(forecastItem);
    });
  }

  // Switch between Celsius and Fahrenheit units
  function toggleUnit(unit) {
    if (unit === 'celsius') {
      currentUnit = 'metric';
      celsiusBtn.classList.add('active');
      fahrenheitBtn.classList.remove('active');
    } else {
      currentUnit = 'imperial';
      fahrenheitBtn.classList.add('active');
      celsiusBtn.classList.remove('active');
    }

    // If weather data is already displayed, fetch updated data with new units
    if (cityName.textContent !== '--') {
      fetchWeather();
    }
  }
  // Update the "Last updated" time display
  function updateLastUpdated() {
    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
  }

  // Show loading indicator (currently just text)
  function showLoading() {
    cityName.textContent = 'Loading...';
  }

  // Hide loading indicator (empty for now)
  function hideLoading() {
    // Could be used to hide spinner or loading message
  }

  // Show error messages (currently using alert)
  function showError(message) {
    alert(message);
  }

  // Clear error messages (empty placeholder)
  function clearError() {
    // Could clear error UI elements if implemented
  }

  // Initialize app with default city "kathmandu"
  cityInput.value = 'kathmandu';
  fetchWeather();
});
