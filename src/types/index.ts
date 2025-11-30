export const WeatherConditions = {
  CLEAR: "clear",
  PARTLY_CLOUDY: "partly_cloudy",
  CLOUDY: "cloudy",
  RAIN: "rain",
  SNOW: "snow",
  THUNDERSTORM: "thunderstorm",
  DRIZZLE: "drizzle",
  MIST: "mist",
  UNKNOWN: "unknown",
} as const;

export type WeatherCondition =
  (typeof WeatherConditions)[keyof typeof WeatherConditions];

export interface DashboardData {
  temperature: number;
  moonPhase: number;
  weather: WeatherCondition;
  isRecyclingWeek: boolean;
  recyclingMessage: string;
}

export interface OpenWeatherResponse {
  current: {
    temp: number;
  };
  daily: Array<{
    moon_phase: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
    }>;
  }>;
}

export function isOpenWeatherResponse(x: unknown): x is OpenWeatherResponse {
  if (!x || typeof x !== 'object') {
    return false;
  }

  const obj = x as Record<string, unknown>;

  // Validate current.temp
  if (!obj.current || typeof obj.current !== 'object') {
    return false;
  }
  const current = obj.current as Record<string, unknown>;
  if (typeof current.temp !== 'number') {
    return false;
  }

  // Validate daily array
  if (!Array.isArray(obj.daily) || obj.daily.length === 0) {
    return false;
  }

  // Validate first daily entry (we only need today's data)
  const firstDaily = obj.daily[0];
  if (!firstDaily || typeof firstDaily !== 'object') {
    return false;
  }

  const daily = firstDaily as Record<string, unknown>;

  // Validate moon_phase
  if (typeof daily.moon_phase !== 'number') {
    return false;
  }

  // Validate weather array
  if (!Array.isArray(daily.weather) || daily.weather.length === 0) {
    return false;
  }

  // Validate weather items have required properties
  for (const weatherItem of daily.weather) {
    if (!weatherItem || typeof weatherItem !== 'object') {
      return false;
    }
    const weather = weatherItem as Record<string, unknown>;
    if (
      typeof weather.id !== 'number' ||
      typeof weather.main !== 'string' ||
      typeof weather.description !== 'string'
    ) {
      return false;
    }
  }

  return true;
}
