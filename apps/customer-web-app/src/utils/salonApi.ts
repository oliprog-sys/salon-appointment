import { Salon, Service, StaffProfile, SubCity } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function mapBackendSalonToCustomer(backendSalon: any): Salon {
  // Normalize services
  const rawServices = backendSalon.services || [];
  const services: Service[] = rawServices.map((s: any) => ({
    id: s.id,
    salonId: s.salonId || backendSalon.id,
    categoryId: s.categoryId || '',
    name: s.name,
    description: s.description || '',
    durationMin: Number(s.durationMin) || 60,
    priceETB: Number(s.priceETB) || 0,
    categoryName: s.category?.name || s.categoryName || 'General Beauty & Care',
  }));

  // Calculate dynamic price range
  let priceRange = 'ETB 600 - 3,500';
  if (services.length > 0) {
    const prices = services.map((s) => s.priceETB).filter((p) => p > 0);
    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      priceRange = min === max ? `ETB ${min.toLocaleString()}` : `ETB ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
  }

  // Normalize staff belonging exclusively to this salon
  const rawStaff = backendSalon.staff || [];
  const staff: StaffProfile[] = rawStaff.map((st: any) => ({
    id: st.id,
    fullName: st.user?.fullName || st.fullName || 'Master Stylist',
    title: st.title || 'Beauty & Wellness Specialist',
    avatarUrl:
      st.user?.avatarUrl ||
      st.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    rating: 4.9,
    isAvailable: st.isAvailable ?? true,
  }));

  // Normalize subCity dynamically
  const normalizedSubCity = (backendSalon.subCity || 'Bole').trim();

  return {
    id: backendSalon.id,
    name: backendSalon.name,
    slug: backendSalon.slug,
    description:
      backendSalon.description ||
      'Experience refined Ethiopian beauty and holistic wellness sanctuary care in Addis Ababa.',
    address: backendSalon.address || `${normalizedSubCity}, Addis Ababa`,
    subCity: normalizedSubCity,
    city: backendSalon.city || 'Addis Ababa',
    rating: 4.9,
    reviewCount: 94 + (backendSalon.id.charCodeAt(0) % 50),
    coverImageUrl:
      backendSalon.coverImageUrl ||
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    gallery:
      Array.isArray(backendSalon.gallery) && backendSalon.gallery.length > 0
        ? backendSalon.gallery
        : [
            'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
          ],
    isVerified: backendSalon.status === 'APPROVED' || backendSalon.isVerified === true,
    isFeatured: Boolean(backendSalon.isFeatured),
    priceRange,
    services,
    staff,
    workingHours: {
      day: 'Monday - Saturday',
      time: '08:30 AM - 08:00 PM',
    },
  };
}

export async function fetchAllSalons(): Promise<Salon[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/salons?limit=50`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[salonApi] Backend returned ${res.status}.`);
      return [];
    }
    const json = await res.json();
    const rawSalons = json.data || json;
    if (Array.isArray(rawSalons) && rawSalons.length > 0) {
      return rawSalons.map(mapBackendSalonToCustomer);
    }
    return [];
  } catch (error) {
    console.error('[salonApi] Could not reach backend API:', error);
    return [];
  }
}

export async function fetchSalonBySlug(slug: string): Promise<Salon | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/salons/${slug}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return mapBackendSalonToCustomer(data);
    }
  } catch (error) {
    console.error(`[salonApi] Failed to fetch salon by slug '${slug}':`, error);
  }
  return null;
}

export async function fetchSalonById(id: string): Promise<Salon | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/salons/${id}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return mapBackendSalonToCustomer(data);
    }
  } catch (error) {
    console.error(`[salonApi] Failed to fetch salon by ID '${id}':`, error);
  }
  return null;
}
