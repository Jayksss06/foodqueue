import { prisma } from '@/lib/prisma';
import { SlotPolicy, EvaluatedSlotResult } from '../domain/slot-policy';
import { Prisma } from '@prisma/client';

export class PickupSlotService {
  /**
   * Memastikan slot pickup untuk tanggal tertentu telah ter-generate di database berdasarkan jam operasional tenant.
   */
  public static async ensureDailySlots(tenantId: string, dateStr: string): Promise<void> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { operatingHours: true },
    });

    if (!tenant) {
      throw new Error('NOT_FOUND: Tenant tidak ditemukan.');
    }

    const [year, month, day] = dateStr.split('-').map((n) => parseInt(n, 10));
    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay();

    const opHour = tenant.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);
    if (!opHour || opHour.isClosed) {
      return; // Tenant tutup pada hari ini
    }

    const slotDefs = SlotPolicy.generateSlotsForDate(
      dateStr,
      opHour.openTime,
      opHour.closeTime,
      tenant.slotDurationMinutes
    );

    // Lakukan upsert agar slot yang sudah ada (mungkin sudah ada order atau custom capacity) tidak tertimpa
    for (const def of slotDefs) {
      await prisma.pickupSlot.upsert({
        where: {
          tenantId_startAt: {
            tenantId,
            startAt: def.startAt,
          },
        },
        create: {
          tenantId,
          date: targetDate,
          startAt: def.startAt,
          endAt: def.endAt,
          capacity: tenant.maxOrdersPerSlot,
          currentOrders: 0,
          status: 'OPEN',
        },
        update: {}, // Jangan timpa jika sudah ada
      });
    }
  }

  /**
   * Mengambil daftar slot pickup untuk tenant dan tanggal tertentu beserta status ketersediaannya
   */
  public static async getAvailableSlots(
    tenantId: string,
    dateStr: string,
    preparationMinutes: number = 10
  ): Promise<EvaluatedSlotResult[]> {
    await this.ensureDailySlots(tenantId, dateStr);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { status: true, isAcceptingOrders: true },
    });

    if (!tenant) {
      throw new Error('NOT_FOUND: Tenant tidak ditemukan.');
    }

    const [year, month, day] = dateStr.split('-').map((n) => parseInt(n, 10));
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const slots = await prisma.pickupSlot.findMany({
      where: {
        tenantId,
        startAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { startAt: 'asc' },
    });

    const now = new Date();

    return slots.map((slot) =>
      SlotPolicy.evaluateAvailability({
        slot: {
          id: slot.id,
          date: slot.date,
          startAt: slot.startAt,
          endAt: slot.endAt,
          capacity: slot.capacity,
          currentOrders: slot.currentOrders,
          status: slot.status as 'OPEN' | 'CLOSED',
        },
        now,
        preparationMinutes,
        isTenantAcceptingOrders: tenant.isAcceptingOrders,
        isTenantActive: tenant.status === 'ACTIVE',
      })
    );
  }

  /**
   * Reservasi 1 kapasitas slot secara atomic (BR-04) di dalam transaksi database
   */
  public static async reserveSlot(
    tx: Prisma.TransactionClient,
    slotId: string
  ): Promise<void> {
    const updatedCount = await tx.$executeRaw`
      UPDATE "pickup_slots"
      SET "current_orders" = "current_orders" + 1
      WHERE "id" = ${slotId}
        AND "status" = 'OPEN'
        AND "current_orders" < "capacity"
    `;

    if (updatedCount === 0) {
      throw new Error('SLOT_FULL: Waktu pengambilan yang Anda pilih sudah penuh. Silakan pilih waktu lain.');
    }
  }

  /**
   * Melepaskan 1 kapasitas slot secara atomic saat pesanan dibatalkan / expired / ditolak
   */
  public static async releaseSlot(
    tx: Prisma.TransactionClient,
    slotId: string
  ): Promise<void> {
    await tx.$executeRaw`
      UPDATE "pickup_slots"
      SET "current_orders" = GREATEST(0, "current_orders" - 1)
      WHERE "id" = ${slotId}
    `;
  }
}
