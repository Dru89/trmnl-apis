export const WeatherConditions = {
  CLEAR: 'clear',
  PARTLY_CLOUDY: 'partly_cloudy',
  CLOUDY: 'cloudy',
  RAIN: 'rain',
  SNOW: 'snow',
  THUNDERSTORM: 'thunderstorm',
  DRIZZLE: 'drizzle',
  MIST: 'mist',
  UNKNOWN: 'unknown',
} as const;

export type WeatherCondition = typeof WeatherConditions[keyof typeof WeatherConditions];

export interface DashboardData {
  temperature: number;
  moonPhase: number;
  weather: WeatherCondition;
  isRecyclingWeek: boolean;
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
