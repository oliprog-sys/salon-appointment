// AuraSalon Instant VIP Favorites Store

export interface FavoriteItem {
  id: string; // unique favorite item id
  salonId: string;
  salonName: string;
  salonSlug: string;
  salonSubCity: string;
  salonCoverImage: string;
  serviceId: string;
  serviceName: string;
  durationMin: number;
  priceETB: number;
  categoryName?: string;
  addedAt: string;
}

const FAVORITES_STORAGE_KEY = 'aurasalon_vip_favorites';

export const getStoredFavorites = (): FavoriteItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveFavorites = (favorites: FavoriteItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  window.dispatchEvent(new Event('aurasalon_favorites_changed'));
  window.dispatchEvent(new Event('storage'));
};

export const isServiceFavorited = (salonId: string, serviceId: string): boolean => {
  const favorites = getStoredFavorites();
  return favorites.some((f) => f.salonId === salonId && f.serviceId === serviceId);
};

export const toggleFavorite = (
  salon: { id: string; name: string; slug: string; subCity: string; coverImageUrl: string },
  service: { id: string; name: string; durationMin: number; priceETB: number; categoryName?: string }
): boolean => {
  const current = getStoredFavorites();
  const existsIndex = current.findIndex(
    (f) => f.salonId === salon.id && f.serviceId === service.id
  );

  if (existsIndex !== -1) {
    current.splice(existsIndex, 1);
    saveFavorites(current);
    return false; // removed
  } else {
    const newItem: FavoriteItem = {
      id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      salonId: salon.id,
      salonName: salon.name,
      salonSlug: salon.slug,
      salonSubCity: salon.subCity,
      salonCoverImage: salon.coverImageUrl,
      serviceId: service.id,
      serviceName: service.name,
      durationMin: service.durationMin,
      priceETB: service.priceETB,
      categoryName: service.categoryName,
      addedAt: new Date().toISOString(),
    };
    current.unshift(newItem);
    saveFavorites(current);
    return true; // added
  }
};

export const removeFavorite = (favoriteId: string) => {
  const current = getStoredFavorites();
  const filtered = current.filter((f) => f.id !== favoriteId);
  saveFavorites(filtered);
};
