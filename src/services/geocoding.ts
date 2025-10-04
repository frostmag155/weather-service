import axios from 'axios';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

export async function getCityCoordinates(city: string): Promise<GeoCoordinates> {
  try {
    const response = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`
    );

    if (!response.data.results || response.data.results.length === 0) {
      throw new Error(`City "${city}" not found`);
    }

    const cityData = response.data.results[0];
    
    return {
      latitude: cityData.latitude,
      longitude: cityData.longitude,
      name: cityData.name,
      country: cityData.country
    };
  } catch (error) {
    throw new Error(`Geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}