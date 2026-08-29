export const arrivalLocationService = {
  async requestNearHospital() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return {
        granted: false,
        available: false,
        reason: 'location-unavailable',
      };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            granted: true,
            available: true,
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
          }),
        (error) =>
          resolve({
            granted: false,
            available: true,
            reason: error?.code === 1 ? 'permission-denied' : 'location-error',
            message: error?.message,
          }),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
      );
    });
  },
};
