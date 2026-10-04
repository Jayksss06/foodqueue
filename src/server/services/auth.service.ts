import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { signSessionToken } from '@/lib/jwt';
import { UserSession } from '@/types';
import { slugify } from '@/lib/utils';

export class AuthService {
  /**
   * Registrasi Customer baru
   */
  public static async registerCustomer(input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ user: UserSession; token: string }> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new Error('EMAIL_TAKEN: Email sudah terdaftar.');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        passwordHash,
        role: 'CUSTOMER',
        phone: input.phone?.trim() || null,
        status: 'ACTIVE',
      },
    });

    const session: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      sessionVersion: user.sessionVersion,
      tenantId: null,
    };

    const token = await signSessionToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: 'CUSTOMER',
      sessionVersion: user.sessionVersion,
      tenantId: null,
    });

    return { user: session, token };
  }

  /**
   * Registrasi Tenant baru (menunggu verifikasi Admin)
   */
  public static async registerTenant(input: {
    name: string;
    email: string;
    password: string;
    phone: string;
    storeName: string;
    location: string;
    description?: string;
  }): Promise<{ user: UserSession; token: string; tenantId: string }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new Error('EMAIL_TAKEN: Email sudah terdaftar.');
    }

    const passwordHash = await hashPassword(input.password);

    // Ambil default venue (Kantin Kampus) atau buat jika belum ada
    let venue = await prisma.venue.findFirst();
    if (!venue) {
      venue = await prisma.venue.create({
        data: {
          name: 'Food Court Kampus Utama',
          address: 'Gedung Pusat Kegiatan Mahasiswa Lt. 1 & 2',
          timezone: 'Asia/Jakarta',
        },
      });
    }

    // Generate unique slug
    let baseSlug = slugify(input.storeName);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.tenant.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    // Jalankan dalam transaksi: buat user, tenant, dan jadwal operasional default (7 hari)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name.trim(),
          email: input.email.toLowerCase().trim(),
          passwordHash,
          role: 'TENANT',
          phone: input.phone.trim(),
          status: 'ACTIVE',
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          ownerId: user.id,
          venueId: venue.id,
          name: input.storeName.trim(),
          slug: finalSlug,
          location: input.location.trim(),
          description: input.description?.trim() || null,
          status: 'PENDING_VERIFICATION',
          defaultPreparationTime: 10,
          slotDurationMinutes: 15,
          maxOrdersPerSlot: 10,
          isAcceptingOrders: true,
        },
      });

      // Buat default jam buka Senin-Sabtu 09:00 - 16:00, Minggu Libur
      const defaultHours = [
        { dayOfWeek: 0, openTime: '09:00', closeTime: '16:00', isClosed: true }, // Minggu
        { dayOfWeek: 1, openTime: '09:00', closeTime: '16:00', isClosed: false }, // Senin
        { dayOfWeek: 2, openTime: '09:00', closeTime: '16:00', isClosed: false }, // Selasa
        { dayOfWeek: 3, openTime: '09:00', closeTime: '16:00', isClosed: false }, // Rabu
        { dayOfWeek: 4, openTime: '09:00', closeTime: '16:00', isClosed: false }, // Kamis
        { dayOfWeek: 5, openTime: '09:00', closeTime: '16:00', isClosed: false }, // Jumat
        { dayOfWeek: 6, openTime: '09:00', closeTime: '15:00', isClosed: false }, // Sabtu
      ];

      await tx.tenantOperatingHour.createMany({
        data: defaultHours.map((h) => ({
          tenantId: tenant.id,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        })),
      });

      return { user, tenant };
    });

    const session: UserSession = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: 'TENANT',
      status: 'ACTIVE',
      sessionVersion: result.user.sessionVersion,
      tenantId: result.tenant.id,
    };

    const token = await signSessionToken({
      sub: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: 'TENANT',
      sessionVersion: result.user.sessionVersion,
      tenantId: result.tenant.id,
    });

    return { user: session, token, tenantId: result.tenant.id };
  }

  /**
   * Login user (Customer, Tenant, atau Admin)
   */
  public static async login(
    email: string,
    plainPassword: string
  ): Promise<{ user: UserSession; token: string }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { tenant: { select: { id: true, status: true } } },
    });

    if (!user) {
      throw new Error('INVALID_CREDENTIALS: Email atau password tidak sesuai.');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('ACCOUNT_SUSPENDED: Akun Anda telah dinonaktifkan oleh administrator.');
    }

    const isMatch = await verifyPassword(plainPassword, user.passwordHash);
    if (!isMatch) {
      throw new Error('INVALID_CREDENTIALS: Email atau password tidak sesuai.');
    }

    const session: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserSession['role'],
      status: user.status as UserSession['status'],
      sessionVersion: user.sessionVersion,
      tenantId: user.tenant?.id ?? null,
    };

    const token = await signSessionToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: session.role,
      sessionVersion: session.sessionVersion,
      tenantId: session.tenantId,
    });

    return { user: session, token };
  }
}
