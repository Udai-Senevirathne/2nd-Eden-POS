// Currency utilities for USD and LKR conversion and formatting
export interface CurrencyConfig {
  code: 'USD' | 'LKR';
  symbol: string;
  name: string;
  decimalPlaces: number;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2
  },
  LKR: {
    code: 'LKR',
    symbol: 'Rs',
    name: 'Sri Lankan Rupee',
    decimalPlaces: 2
  }
};

// Exchange rates (you can update these or fetch from an API)
const EXCHANGE_RATES: Record<string, number> = {
  USD_TO_LKR: 325.00, // 1 USD = 325 LKR (approximate)
  LKR_TO_USD: 1 / 325.00
};

export class CurrencyConverter {
  /**
   * Convert amount from one currency to another
   */
  static convert(amount: number, fromCurrency: 'USD' | 'LKR', toCurrency: 'USD' | 'LKR'): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    if (fromCurrency === 'USD' && toCurrency === 'LKR') {
      return amount * EXCHANGE_RATES.USD_TO_LKR;
    }

    if (fromCurrency === 'LKR' && toCurrency === 'USD') {
      return amount * EXCHANGE_RATES.LKR_TO_USD;
    }

    return amount;
  }

  /**
   * Format amount according to currency
   */
  static format(amount: number, currency: 'USD' | 'LKR'): string {
    const config = CURRENCIES[currency];
    const roundedAmount = Math.round(amount * Math.pow(10, config.decimalPlaces)) / Math.pow(10, config.decimalPlaces);
    
    if (currency === 'USD') {
      return `$${roundedAmount.toFixed(config.decimalPlaces)}`;
    } else if (currency === 'LKR') {
      // Format LKR with proper number formatting (commas for thousands)
      return `Rs ${roundedAmount.toLocaleString('en-US', { 
        minimumFractionDigits: config.decimalPlaces,
        maximumFractionDigits: config.decimalPlaces 
      })}`;
    }
    
    return `${config.symbol}${roundedAmount.toFixed(config.decimalPlaces)}`;
  }

  /**
   * Get currency symbol
   */
  static getSymbol(currency: 'USD' | 'LKR'): string {
    return CURRENCIES[currency]?.symbol || '$';
  }

  /**
   * Get currency config
   */
  static getConfig(currency: 'USD' | 'LKR'): CurrencyConfig {
    return CURRENCIES[currency] || CURRENCIES.USD;
  }

  /**
   * Update exchange rates (for future API integration)
   */
  static updateExchangeRates(rates: Partial<typeof EXCHANGE_RATES>) {
    Object.assign(EXCHANGE_RATES, rates);
  }

  /**
   * Get current exchange rate
   */
  static getExchangeRate(fromCurrency: 'USD' | 'LKR', toCurrency: 'USD' | 'LKR'): number {
    if (fromCurrency === toCurrency) return 1;
    
    if (fromCurrency === 'USD' && toCurrency === 'LKR') {
      return EXCHANGE_RATES.USD_TO_LKR;
    }
    
    if (fromCurrency === 'LKR' && toCurrency === 'USD') {
      return EXCHANGE_RATES.LKR_TO_USD;
    }
    
    return 1;
  }
}

/**
 * Hook for currency formatting in components
 */
export const useCurrency = (selectedCurrency: 'USD' | 'LKR' = 'USD') => {
  const formatPrice = (amount: number): string => {
    return CurrencyConverter.format(amount, selectedCurrency);
  };

  const convertPrice = (amount: number, fromCurrency: 'USD' | 'LKR'): number => {
    return CurrencyConverter.convert(amount, fromCurrency, selectedCurrency);
  };

  const getSymbol = (): string => {
    return CurrencyConverter.getSymbol(selectedCurrency);
  };

  return {
    formatPrice,
    convertPrice,
    getSymbol,
    currency: selectedCurrency,
    config: CurrencyConverter.getConfig(selectedCurrency)
  };
};