
export const getWeatherDescription = (code: number): string => {
  const weatherCodes: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  
  return weatherCodes[code] || "Unknown conditions";
};

export const getWeatherIcon = (code: number, isDay: boolean = true): string => {
  // Map weather codes to icon names (could be extended with a proper icon library)
  if (code === 0) return isDay ? "sun" : "moon";
  if (code === 1 || code === 2) return isDay ? "cloud-sun" : "cloud-moon";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "cloud-fog";
  if (code >= 51 && code <= 57) return "cloud-drizzle";
  if (code >= 61 && code <= 67) return "cloud-rain";
  if (code >= 71 && code <= 77) return "cloud-snow";
  if (code >= 80 && code <= 82) return "cloud-rain";
  if (code >= 85 && code <= 86) return "cloud-snow";
  if (code >= 95) return "cloud-lightning";
  
  return "cloud";
};

// New direct API calling functions
export const searchLocations = async (query: string) => {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching locations:', error);
    throw error;
  }
};

export const fetchWeatherData = async (lat: number, lon: number, locationName: string = '') => {
  try {
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.append('latitude', lat.toString());
    weatherUrl.searchParams.append('longitude', lon.toString());
    weatherUrl.searchParams.append('current', [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'is_day'
    ].join(','));
    weatherUrl.searchParams.append('daily', [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'wind_speed_10m_max'
    ].join(','));
    weatherUrl.searchParams.append('timezone', 'auto');
    weatherUrl.searchParams.append('forecast_days', '7');

    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.current) {
      throw new Error('Weather data not available');
    }

    const weatherCode = data.current.weather_code;
    const weatherDescription = getWeatherDescription(weatherCode);
    const tempC = data.current.temperature_2m;
    const tempF = (tempC * 9/5) + 32;
    const humidity = data.current.relative_humidity_2m;

    // Transform data to match WeatherData interface
    return {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      location: locationName,
      apparentTemperature: data.current.apparent_temperature,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      windDirection: data.current.wind_direction_10m,
      windGusts: data.current.wind_gusts_10m,
      isDay: data.current.is_day === 1,
      forecast: data.daily ? {
        dates: data.daily.time,
        weatherCodes: data.daily.weather_code,
        maxTemps: data.daily.temperature_2m_max,
        minTemps: data.daily.temperature_2m_min,
        precipitationProb: data.daily.precipitation_probability_max,
        maxWindSpeed: data.daily.wind_speed_10m_max
      } : null
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};
