import { Salon, Service, StaffProfile, SubCity } from '@/types';
import { MOCK_SALONS } from '@/data/mockData';

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

  // Normalize staff
  const rawStaff = backendSalon.staff || [];
  const staff: StaffProfile[] =
    rawStaff.length > 0
      ? rawStaff.map((st: any) => ({
          id: st.id,
          fullName: st.user?.fullName || 'Master Stylist',
          title: st.title || 'Beauty & Wellness Specialist',
          avatarUrl:
            st.user?.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          rating: 4.9,
          isAvailable: st.isAvailable ?? true,
        }))
      : [
          {
            id: `st-default-${backendSalon.id}`,
            fullName: 'Master Stylist & Artist',
            title: 'Senior Salon Specialist',
            avatarUrl:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            rating: 4.9,
            isAvailable: true,
          },
        ];

  // Normalize subCity
  const validSubCities: SubCity[] = ['Bole', 'Kazanchis', 'Piassa', 'Old Airport', 'Sarbet'];
  const matchedSubCity =
    validSubCities.find(
      (sc) => sc.toLowerCase() === (backendSalon.subCity || '').toLowerCase().trim()
    ) || 'Bole';

  return {
    id: backendSalon.id,
    name: backendSalon.name,
    slug: backendSalon.slug,
    description:
      backendSalon.description ||
      'Experience refined Ethiopian beauty and holistic wellness sanctuary care in Addis Ababa.',
    address: backendSalon.address || `${matchedSubCity}, Addis Ababa`,
    subCity: matchedSubCity,
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
    isFeatured: backendSalon.isFeatured ?? true,
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
      console.warn(`[salonApi] Backend returned ${res.status}. Falling back to initial seed.`);
      return MOCK_SALONS;
    }
    const json = await res.json();
    const rawSalons = json.data || json;
    if (Array.isArray(rawSalons) && rawSalons.length > 0) {
      return rawSalons.map(mapBackendSalonToCustomer);
    }
    return MOCK_SALONS;
  } catch (error) {
    console.warn('[salonApi] Could not reach backend API. Falling back to local data:', error);
    return MOCK_SALONS;
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
    console.warn(`[salonApi] Failed to fetch salon by slug '${slug}':`, error);
  }
  // Fallback to local mock data
  const fallback = MOCK_SALONS.find((s) => s.slug === slug);
  return fallback || null;
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
    console.warn(`[salonApi] Failed to fetch salon by ID '${id}':`, error);
  }
  // Fallback to local mock data
  const fallback = MOCK_SALONS.find((s) => s.id === id);
  return fallback || null;
}
