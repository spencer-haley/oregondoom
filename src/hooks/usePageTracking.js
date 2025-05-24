import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export default function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (!window.gtag || !GA_MEASUREMENT_ID) return;

    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: location.pathname,
    });
  }, [location]);
}
