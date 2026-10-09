import { z } from 'zod';

// ================= AUTH SCHEMAS =================
export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const registerCustomerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor telepon seluler Indonesia tidak valid').optional().or(z.literal('')),
});

export const registerTenantSchema = z.object({
  name: z.string().min(2, 'Nama pemilik minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Nomor telepon wajib diisi untuk tenant'),
  storeName: z.string().min(2, 'Nama toko/tenant minimal 2 karakter').max(100),
  location: z.string().min(2, 'Lokasi stan (misal: Lantai 1 Kantin Pusat) minimal 2 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor telepon tidak valid').optional().or(z.literal('')),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama harus diisi'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
});

// ================= MENU SCHEMAS =================
export const createMenuSchema = z.object({
  categoryId: z.string().min(1, 'Kategori harus dipilih'),
  name: z.string().min(2, 'Nama menu minimal 2 karakter').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  price: z.number().int().min(0, 'Harga tidak boleh negatif'),
  imageUrl: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
  stock: z.number().int().min(0, 'Stok tidak boleh negatif'),
  preparationTime: z.number().int().min(1, 'Estimasi waktu persiapan minimal 1 menit').max(120),
  status: z.enum(['AVAILABLE', 'UNAVAILABLE', 'OUT_OF_STOCK']).default('AVAILABLE'),
});

export const updateMenuSchema = createMenuSchema.partial();

// ================= TENANT SETTINGS SCHEMAS =================
export const updateTenantProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  defaultPreparationTime: z.number().int().min(1).max(120).optional(),
  slotDurationMinutes: z.number().int().min(5).max(60).optional(),
  maxOrdersPerSlot: z.number().int().min(1).max(100).optional(),
  isAcceptingOrders: z.boolean().optional(),
});

export const operatingHourItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm'),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam harus HH:mm'),
  isClosed: z.boolean(),
});

export const updateOperatingHoursSchema = z.object({
  hours: z.array(operatingHourItemSchema).length(7, 'Jadwal operasional harus mencakup 7 hari (Minggu s/d Sabtu)'),
});

// ================= CART SCHEMAS =================
export const addToCartSchema = z.object({
  menuId: z.string().min(1, 'ID menu harus diisi'),
  quantity: z.number().int().min(1, 'Quantity minimal 1'),
  notes: z.string().max(200, 'Catatan maksimal 200 karakter').optional().or(z.literal('')),
  replaceCart: z.boolean().optional().default(false),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity minimal 1'),
  notes: z.string().max(200).optional().or(z.literal('')),
});

// ================= CHECKOUT & ORDER SCHEMAS =================
export const checkoutSchema = z.object({
  pickupSlotId: z.string().min(1, 'Pickup slot harus dipilih'),
  notes: z.string().max(300, 'Catatan pesanan maksimal 300 karakter').optional().or(z.literal('')),
  idempotencyKey: z.string().uuid('Idempotency key harus berupa format UUID v4'),
  isGuest: z.boolean().optional(),
  guestName: z.string().min(2, 'Nama pemesan minimal 2 karakter').max(100).optional(),
  guestPhone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor WhatsApp / HP tidak valid').optional(),
  guestItems: z
    .array(
      z.object({
        menuId: z.string().min(1),
        quantity: z.number().int().min(1),
        notes: z.string().max(200).optional().or(z.literal('')),
      })
    )
    .optional(),
});

export const updateOrderStatusSchema = z.object({
  to: z.enum([
    'ACCEPTED',
    'REJECTED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'NO_SHOW',
    'COMPLETED',
    'CANCELLED',
  ]),
  note: z.string().max(250).optional(),
});

export const verifyPickupSchema = z.object({
  code: z
    .string()
    .min(4, 'Kode pickup minimal 4 karakter')
    .max(12, 'Kode pickup maksimal 12 karakter')
    .trim()
    .toUpperCase(),
});

// ================= PAYMENT SCHEMAS =================
export const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, 'ID order harus diisi'),
  method: z.enum(['QRIS', 'EWALLET', 'VIRTUAL_ACCOUNT']),
  token: z.string().optional(),
});

export const simulatePaymentSchema = z.object({
  outcome: z.enum(['SUCCESS', 'FAILURE']),
  token: z.string().optional(),
});

// ================= REVIEW SCHEMAS =================
export const createReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating minimal 1 bintang').max(5, 'Rating maksimal 5 bintang'),
  comment: z.string().max(500, 'Komentar maksimal 500 karakter').optional().or(z.literal('')),
});

// ================= ADMIN SCHEMAS =================
export const updateTenantVerificationSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED', 'SUSPENDED']),
  note: z.string().max(250).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

export const updateSystemSettingsSchema = z.record(z.string(), z.string());
