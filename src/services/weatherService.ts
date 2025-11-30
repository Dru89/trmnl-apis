import {
  WeatherCondition,
  WeatherConditions,
  isOpenWeatherResponse,
} from "../types";
import Cache from "./cache";

/**
 * Maps OpenWeatherMap weather condition IDs to our WeatherCondition type
 * https://openweathermap.org/weather-conditions
 */
function mapWeatherCondition(weatherId: number): WeatherCondition {
  // Thunderstorm (200-232)
  if (weatherId >= 200 && weatherId < 300) {
    return WeatherConditions.THUNDERSTORM;
  }
  // Drizzle (300-321)
  if (weatherId >= 300 && weatherId < 400) {
    return WeatherConditions.DRIZZLE;
  }
  // Rain (500-531)
  if (weatherId >= 500 && weatherId < 600) {
    return WeatherConditions.RAIN;
  }
  // Snow (600-622)
  if (weatherId >= 600 && weatherId < 700) {
    return WeatherConditions.SNOW;
  }
  // Atmosphere (701-781) - mist, fog, haze, etc.
  if (weatherId >= 700 && weatherId < 800) {
    return WeatherConditions.MIST;
  }
  // Clear (800)
  if (weatherId === 800) {
    return WeatherConditions.CLEAR;
  }
  // Clouds (801-804)
  if (weatherId === 801 || weatherId === 802) {
    return WeatherConditions.PARTLY_CLOUDY;
  }
  if (weatherId === 803 || weatherId === 804) {
    return WeatherConditions.CLOUDY;
  }

  return WeatherConditions.UNKNOWN;
}

/**
 * Determines the most significant weather condition for today
 * Priority: snow > thunderstorm > rain > drizzle > mist > cloudy > partly_cloudy > clear
 */
function getMostSignificantWeather(
  conditions: WeatherCondition[]
): WeatherCondition {
  const priority: Record<WeatherCondition, number> = {
    [WeatherConditions.SNOW]: 7,
    [WeatherConditions.THUNDERSTORM]: 6,
    [WeatherConditions.RAIN]: 5,
    [WeatherConditions.DRIZZLE]: 4,
    [WeatherConditions.MIST]: 3,
    [WeatherConditions.CLOUDY]: 2,
    [WeatherConditions.PARTLY_CLOUDY]: 1,
    [WeatherConditions.CLEAR]: 0,
    [WeatherConditions.UNKNOWN]: -1,
  };

  return conditions.reduce((mostSignificant, current) => {
    return priority[current] > priority[mostSignificant]
      ? current
      : mostSignificant;
  }, WeatherConditions.CLEAR);
}

interface WeatherData {
  temperature: number;
  moonPhase: number;
  weather: WeatherCondition;
}

async function getWeatherDataFromAPI(
  lat: number,
  lon: number,
  apiKey: string
): Promise<WeatherData> {
  // Fetch fresh data from API
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=imperial&appid=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `OpenWeatherMap API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Validate response structure using type guard
  if (!isOpenWeatherResponse(data)) {
    throw new Error("Invalid response format from OpenWeatherMap API");
  }

  // Get all weather conditions for today and find the most significant
  const todayWeatherConditions =
    data.daily[0]?.weather?.map((w) => mapWeatherCondition(w.id)) || [];

  const weather =
    todayWeatherConditions.length > 0
      ? getMostSignificantWeather(todayWeatherConditions)
      : WeatherConditions.UNKNOWN;

  return {
    temperature: Math.round(data.current.temp),
    moonPhase: data.daily[0].moon_phase,
    weather,
  };
}

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Cache<WeatherData>("weather-cache", CACHE_DURATION_MS);

export async function getWeatherData(
  lat: number,
  lon: number
): Promise<{
  temperature: number;
  moonPhase: number;
  weather: WeatherCondition;
}> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY environment variable is not set");
  }

  // Create a cache key based on coordinates
  const cacheKey = `weather-${lat}-${lon}`;

  const cachedData = await cache.get(cacheKey);
  if (cachedData != null) {
    return cachedData;
  }

  const result = await getWeatherDataFromAPI(lat, lon, apiKey);
  await cache.set(cacheKey, result);

  return result;
}
