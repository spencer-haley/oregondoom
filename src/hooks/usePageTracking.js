import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export default function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    console.log('[GA] Page view', location.pathname);
    console.log('[GA] ID:', GA_MEASUREMENT_ID);
    console.log('[GA] window.gtag:', typeof window.gtag);

    if (typeof window.gtag !== 'function' || !GA_MEASUREMENT_ID) {
      console.warn('[GA] gtag not initialized or missing ID');
      return;
    }

    // REQUIRED: Initialize config (even if also done in index.html)
    window.gtag('config', GA_MEASUREMENT_ID, {
      debug_mode: true,
      page_path: location.pathname,
    });

    // Log event manually for good measure
    window.gtag('event', 'page_view', {
      page_path: location.pathname,
      send_to: GA_MEASUREMENT_ID,
    });
  }, [location]);
}
