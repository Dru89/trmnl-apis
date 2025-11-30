import { WeatherCondition, OpenWeatherResponse } from "../types";
import { getStore } from "@netlify/blobs";

/**
 * Maps OpenWeatherMap weather condition IDs to our WeatherCondition enum
 * https://openweathermap.org/weather-conditions
 */
function mapWeatherCondition(weatherId: number): WeatherCondition {
  // Thunderstorm (200-232)
  if (weatherId >= 200 && weatherId < 300) {
    return WeatherCondition.THUNDERSTORM;
  }
  // Drizzle (300-321)
  if (weatherId >= 300 && weatherId < 400) {
    return WeatherCondition.DRIZZLE;
  }
  // Rain (500-531)
  if (weatherId >= 500 && weatherId < 600) {
    return WeatherCondition.RAIN;
  }
  // Snow (600-622)
  if (weatherId >= 600 && weatherId < 700) {
    return WeatherCondition.SNOW;
  }
  // Atmosphere (701-781) - mist, fog, haze, etc.
  if (weatherId >= 700 && weatherId < 800) {
    return WeatherCondition.MIST;
  }
  // Clear (800)
  if (weatherId === 800) {
    return WeatherCondition.CLEAR;
  }
  // Clouds (801-804)
  if (weatherId === 801 || weatherId === 802) {
    return WeatherCondition.PARTLY_CLOUDY;
  }
  if (weatherId === 803 || weatherId === 804) {
    return WeatherCondition.CLOUDY;
  }

  return WeatherCondition.UNKNOWN;
}

/**
 * Determines the most significant weather condition for today
 * Priority: snow > thunderstorm > rain > drizzle > mist > cloudy > partly_cloudy > clear
 */
function getMostSignificantWeather(
  conditions: WeatherCondition[]
): WeatherCondition {
  const priority: Record<WeatherCondition, number> = {
    [WeatherCondition.SNOW]: 7,
    [WeatherCondition.THUNDERSTORM]: 6,
    [WeatherCondition.RAIN]: 5,
    [WeatherCondition.DRIZZLE]: 4,
    [WeatherCondition.MIST]: 3,
    [WeatherCondition.CLOUDY]: 2,
    [WeatherCondition.PARTLY_CLOUDY]: 1,
    [WeatherCondition.CLEAR]: 0,
    [WeatherCondition.UNKNOWN]: -1,
  };

  return conditions.reduce((mostSignificant, current) => {
    return priority[current] > priority[mostSignificant]
      ? current
      : mostSignificant;
  }, WeatherCondition.CLEAR);
}

interface CachedWeatherData {
  temperature: number;
  moonPhase: number;
  weather: WeatherCondition;
  cachedAt: number;
}

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// Simple in-memory cache for local development (when Netlify Blobs is unavailable)
const localCache = new Map<string, CachedWeatherData>();

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
  let useLocalCache = false;

  // Try to get cached data from Netlify Blobs
  try {
    const store = getStore("weather-cache");
    const cachedData = (await store.get(cacheKey, {
      type: "json",
    })) as CachedWeatherData | null;

    if (cachedData && cachedData.cachedAt) {
      const age = Date.now() - cachedData.cachedAt;

      // If cache is less than 10 minutes old, return it
      if (age < CACHE_DURATION_MS) {
        console.log('Returning cached weather data from Netlify Blobs');
        return {
          temperature: cachedData.temperature,
          moonPhase: cachedData.moonPhase,
          weather: cachedData.weather,
        };
      }
    }
  } catch (error) {
    // Netlify Blobs not available, fall back to in-memory cache
    useLocalCache = true;
    console.log("Using local in-memory cache (Netlify Blobs unavailable)");

    const localData = localCache.get(cacheKey);
    if (localData && localData.cachedAt) {
      const age = Date.now() - localData.cachedAt;

      if (age < CACHE_DURATION_MS) {
        console.log('Returning cached weather data from local cache');
        return {
          temperature: localData.temperature,
          moonPhase: localData.moonPhase,
          weather: localData.weather,
        };
      }
    }
  }

  // Fetch fresh data from API
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=imperial&appid=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `OpenWeatherMap API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as OpenWeatherResponse;

  // Current temperature
  const temperature = Math.round(data.current.temp);

  // Tonight's moon phase (from today's daily forecast)
  const moonPhase = data.daily[0].moon_phase;

  // Get all weather conditions for today and find the most significant
  const todayWeatherConditions = data.daily[0].weather.map((w) =>
    mapWeatherCondition(w.id)
  );
  const weather = getMostSignificantWeather(todayWeatherConditions);

  const result = {
    temperature,
    moonPhase,
    weather,
  };

  // Cache the result
  const cacheData: CachedWeatherData = {
    ...result,
    cachedAt: Date.now(),
  };

  if (useLocalCache) {
    // Use in-memory cache for local development
    localCache.set(cacheKey, cacheData);
    console.log('Weather data cached in local memory');
  } else {
    // Use Netlify Blobs in production
    try {
      const store = getStore("weather-cache");
      await store.set(cacheKey, JSON.stringify(cacheData));
      console.log('Weather data cached in Netlify Blobs');
    } catch (error) {
      // Fall back to local cache if Netlify Blobs fails
      localCache.set(cacheKey, cacheData);
      console.log('Weather data cached in local memory (Netlify Blobs failed)');
    }
  }

  return result;
}
