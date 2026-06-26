export interface WeatherOracleConfig {
  latitude: number;
  longitude: number;
  targetDate: string; // ISO-8601 YYYY-MM-DD
  metric: 'temperature_max' | 'precipitation_sum' | 'windspeed_max';
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
}

export interface CryptoOracleConfig {
  coinId: string; // e.g., 'bitcoin', 'ethereum'
  targetTimestamp: number; // Unix timestamp (seconds)
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
}

export interface OracleValidationResult {
  validated: boolean;
  value: number;
  source: string;
  timestamp: string;
}

/**
 * Validate a weather oracle using Open-Meteo API.
 * Falls back gracefully if offline.
 */
export async function validateWeatherOracle(
  config: WeatherOracleConfig,
): Promise<OracleValidationResult> {
  const now = new Date().toISOString();

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', config.latitude.toString());
    url.searchParams.set('longitude', config.longitude.toString());
    url.searchParams.set('start_date', config.targetDate);
    url.searchParams.set('end_date', config.targetDate);
    url.searchParams.set('daily', config.metric);
    url.searchParams.set('timezone', 'UTC');

    const response = await fetch(url.toString(), { timeout: 10000 } as RequestInit);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();
    const daily = data.daily?.[config.metric];
    if (!daily || !Array.isArray(daily) || daily.length === 0) {
      throw new Error('No weather data returned for target date');
    }

    const value = daily[0] as number;
    let validated = false;

    switch (config.operator) {
      case 'gt':
        validated = value > config.threshold;
        break;
      case 'lt':
        validated = value < config.threshold;
        break;
      case 'eq':
        validated = Math.abs(value - config.threshold) < 0.01;
        break;
    }

    return {
      validated,
      value,
      source: 'open-meteo',
      timestamp: now,
    };
  } catch (error) {
    return {
      validated: false,
      value: 0,
      source: 'offline',
      timestamp: now,
    };
  }
}

/**
 * Validate a crypto oracle using CoinGecko API.
 * Falls back gracefully if offline.
 */
export async function validateCryptoOracle(
  config: CryptoOracleConfig,
): Promise<OracleValidationResult> {
  const now = new Date().toISOString();

  try {
    const date = new Date(config.targetTimestamp * 1000);
    const dateStr = date.toISOString().split('T')[0];

    const url = `https://api.coingecko.com/api/v3/coins/${config.coinId}/history?date=${dateStr}`;

    const response = await fetch(url, { timeout: 10000 } as RequestInit);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const priceUsd = data.market_data?.current_price?.usd as number;
    if (typeof priceUsd !== 'number') {
      throw new Error('No price data returned for target date');
    }

    let validated = false;
    switch (config.operator) {
      case 'gt':
        validated = priceUsd > config.threshold;
        break;
      case 'lt':
        validated = priceUsd < config.threshold;
        break;
      case 'eq':
        validated = Math.abs(priceUsd - config.threshold) < 0.01;
        break;
    }

    return {
      validated,
      value: priceUsd,
      source: 'coingecko',
      timestamp: now,
    };
  } catch (error) {
    return {
      validated: false,
      value: 0,
      source: 'offline',
      timestamp: now,
    };
  }
}

/**
 * Validate a manual oracle. Host marks result.
 */
export async function validateManualOracle(
  _wagerId: Uuid,
  _hostDeclaredOptionId: Uuid,
): Promise<OracleValidationResult> {
  return {
    validated: true,
    value: 1,
    source: 'manual',
    timestamp: new Date().toISOString(),
  };
}

type Uuid = string;
