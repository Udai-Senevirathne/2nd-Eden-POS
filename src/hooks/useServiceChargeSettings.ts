import { useState, useEffect } from 'react';
import { settingsService } from '../services/database';

interface ServiceChargeSettings {
  serviceCharge: number;
  autoServiceCharge: boolean;
  loading: boolean;
}

export const useServiceChargeSettings = (): ServiceChargeSettings => {
  const [serviceCharge, setServiceCharge] = useState<number>(8.5); // Default 8.5%
  const [autoServiceCharge, setAutoServiceCharge] = useState<boolean>(true); // Default enabled
  const [loading, setLoading] = useState<boolean>(true);
  const [previousServiceCharge, setPreviousServiceCharge] = useState<number>(8.5);

  useEffect(() => {
    const loadServiceChargeSettings = async () => {
      try {
        setLoading(true);
        
        // Try to get service charge from database settings
        const restaurantSettings = await settingsService.get('restaurant');
        
        console.log('🔍 Loading service charge settings:', restaurantSettings);
        
        if (restaurantSettings && typeof restaurantSettings === 'object') {
          const settings = restaurantSettings as { serviceCharge?: number; autoServiceCharge?: boolean };
          console.log('📊 Service charge from settings:', settings.serviceCharge);
          console.log('🔧 Auto service charge from settings:', settings.autoServiceCharge);
          
          if (typeof settings.serviceCharge === 'number' && settings.serviceCharge >= 0) {
            const newServiceCharge = settings.serviceCharge;
            
            // Check if service charge changed and show notification
            if (newServiceCharge !== previousServiceCharge && !loading) {
              console.log(`Service charge updated: ${previousServiceCharge}% → ${newServiceCharge}%`);
            }
            
            setPreviousServiceCharge(serviceCharge);
            setServiceCharge(newServiceCharge);
            console.log('✅ Service charge set to:', newServiceCharge);
          } else {
            console.log('⚠️ No valid service charge found, keeping default 8.5%');
            // Ensure we save the default to the database
            try {
              const defaultRestaurantSettings = {
                ...settings,
                serviceCharge: 8.5,
                autoServiceCharge: true
              };
              await settingsService.set('restaurant', defaultRestaurantSettings);
              console.log('💾 Saved default service charge to database');
            } catch (saveError) {
              console.warn('Failed to save default service charge:', saveError);
            }
          }
          
          if (typeof settings.autoServiceCharge === 'boolean') {
            setAutoServiceCharge(settings.autoServiceCharge);
            console.log('✅ Auto service charge set to:', settings.autoServiceCharge);
          } else {
            console.log('⚠️ No valid auto service charge found, keeping default true');
          }
        } else {
          console.log('⚠️ No restaurant settings found, creating defaults');
          // Create default settings
          try {
            const defaultSettings = {
              name: '2nd Eden Restaurant',
              address: '123 Main Street, City, State 12345',
              phone: '+1 (555) 123-4567',
              logoUrl: '',
              operatingHours: { open: '09:00', close: '22:00' },
              serviceCharge: 8.5,
              currency: 'USD',
              autoServiceCharge: true
            };
            await settingsService.set('restaurant', defaultSettings);
            console.log('💾 Created default restaurant settings');
          } catch (createError) {
            console.warn('Failed to create default settings:', createError);
          }
        }
      } catch (error) {
        console.warn('Failed to load service charge settings, using default:', error);
        // Keep default 8.5%
      } finally {
        setLoading(false);
      }
    };

    // Load settings immediately
    loadServiceChargeSettings();

    // Set up real-time polling for service charge changes (faster polling)
    const interval = setInterval(loadServiceChargeSettings, 500); // Check every 500ms for faster updates

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // We want this to run only once on mount

  return {
    serviceCharge,
    autoServiceCharge,
    loading
  };
};

export const calculateServiceCharge = (subtotal: number, serviceChargeRate: number): number => {
  return subtotal * (serviceChargeRate / 100);
};

export const calculateTotal = (subtotal: number, serviceChargeRate: number): number => {
  return subtotal + calculateServiceCharge(subtotal, serviceChargeRate);
};