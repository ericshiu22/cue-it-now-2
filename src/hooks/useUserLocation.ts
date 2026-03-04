import { useState, useEffect } from "react";

export interface UserLocation {
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
}

export const useUserLocation = (): UserLocation => {
  const [location, setLocation] = useState<UserLocation>({
    city: null,
    state: null,
    lat: null,
    lng: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({ ...prev, loading: false, error: "Geolocation not supported" }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode using free BigDataCloud API (no key needed)
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          setLocation({
            city: data.city || data.locality || null,
            state: data.principalSubdivision || null,
            lat: latitude,
            lng: longitude,
            loading: false,
            error: null,
          });
        } catch {
          // Still have coords even if geocode fails
          setLocation({
            city: null,
            state: null,
            lat: latitude,
            lng: longitude,
            loading: false,
            error: "Could not determine city",
          });
        }
      },
      (err) => {
        setLocation((prev) => ({
          ...prev,
          loading: false,
          error: err.code === 1 ? "Location permission denied" : "Could not get location",
        }));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  return location;
};
