import { Router } from 'express';
import { getCityCoordinates } from '../services/geocoding';
import { getWeatherForecast, WeatherForecast } from '../services/weather';
import { translateCityName, isRussianCity, getAvailableRussianCities } from '../services/translation';
import cache from '../services/cache';

const router = Router();

function validateCity(city: string): boolean {
  return typeof city === 'string' && city.trim().length > 0 && city.trim().length < 100;
}

router.get('/', async (req, res) => {
  try {
    const city = (req.query.city as string)?.trim();

    if (!city || !validateCity(city)) {
      return res.status(400).json({ 
        error: 'Введите название города (1-100 символов)' 
      });
    }

    // переводим 
    const englishCityName = translateCityName(city);
    const cacheKey = `weather:${englishCityName.toLowerCase()}`;
    const cachedData = cache.get<WeatherForecast>(cacheKey);

    if (cachedData) {
      return res.json({
        ...cachedData,
        originalCity: city,
        translatedCity: isRussianCity(city) ? englishCityName : undefined,
        cached: true,
        cacheExpiresIn: '15 минут'
      });
    }

    const coordinates = await getCityCoordinates(englishCityName);
    const weatherData = await getWeatherForecast(coordinates);
    
    cache.set(cacheKey, weatherData, 15 * 60 * 1000);

    res.json({
      ...weatherData,
      originalCity: city,
      translatedCity: isRussianCity(city) ? englishCityName : undefined,
      cached: false,
      cacheExpiresIn: '15 минут'
    });

  } catch (error) {
    console.error('Weather API error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Город не найден' });
    }
    
    res.status(500).json({ 
      error: 'Ошибка при получении данных о погоде',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

router.get('/chart', async (req, res) => {
  try {
    const city = (req.query.city as string)?.trim();

    if (!city || !validateCity(city)) {
      return res.status(400).json({ 
        error: 'Введите название города (1-100 символов)' 
      });
    }

    const englishCityName = translateCityName(city);
    const cacheKey = `weather:${englishCityName.toLowerCase()}`;
    let weatherData = cache.get<WeatherForecast>(cacheKey);

    if (!weatherData) {
      const coordinates = await getCityCoordinates(englishCityName);
      weatherData = await getWeatherForecast(coordinates);
      cache.set(cacheKey, weatherData, 15 * 60 * 1000);
    }

    const chart = generateTextChart(weatherData.hourly);
    
    let title = `🌤️  Прогноз погоды для ${weatherData.city}, ${weatherData.country}`;
    if (isRussianCity(city)) {
      title = `🌤️  Прогноз погоды для ${city} (${weatherData.city}), ${weatherData.country}`;
    }
    
    res.set('Content-Type', 'text/plain');
    res.send(`${title}\n\n${chart}`);

  } catch (error) {
    console.error('Chart generation error:', error);
    res.status(500).json({ 
      error: 'Ошибка при создании графика',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

router.get('/cities', (req, res) => {
  const cities = getAvailableRussianCities();
  res.json({
    availableCities: cities,
    count: cities.length
  });
});

function generateTextChart(hourlyData: any[]): string {
  let chart = 'Время    | Температура | График\n';
  chart += '--------------------------------\n';

  const temps = hourlyData.map(d => d.temperature);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  
  hourlyData.forEach((data, index) => {
    if (index % 2 === 0) {
      const time = new Date(data.time).getHours().toString().padStart(2, '0') + ':00';
      const temp = data.temperature.toFixed(1).padStart(5, ' ');
      
      const scale = maxTemp - minTemp;
      const barsCount = scale > 0 ? Math.round(((data.temperature - minTemp) / scale) * 10) : 5;
      const bars = '█'.repeat(Math.max(1, barsCount));
      
      chart += `${time}     | ${temp}°C   | ${bars}\n`;
    }
  });

  chart += `\n📊 Диапазон температур: ${minTemp.toFixed(1)}°C до ${maxTemp.toFixed(1)}°C`;
  return chart;
}

export default router;