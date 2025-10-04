import axios from 'axios';
import { GeoCoordinates } from './geocoding';

export interface WeatherData {
  temperature: number;
  time: string;
}

export interface WeatherForecast {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  hourly: WeatherData[];
  cached: boolean;
}

export async function getWeatherForecast(coordinates: GeoCoordinates): Promise<WeatherForecast> {
  try {
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&hourly=temperature_2m`
    );

    const hourlyData = response.data.hourly;
    const temperatures: WeatherData[] = [];

    // Берем прогноз на ближайшие 24 часа
    for (let i = 0; i < 24; i++) {
      temperatures.push({
        temperature: hourlyData.temperature_2m[i],
        time: hourlyData.time[i]
      });
    }

    return {
      city: coordinates.name,
      country: coordinates.country,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      hourly: temperatures,
      cached: false
    };
  } catch (error) {
    throw new Error(`Weather API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}