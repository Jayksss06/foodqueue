export interface OperatingHourDef {
  dayOfWeek: number; // 0 = Minggu ... 6 = Sabtu
  openTime: string; // "10:00"
  closeTime: string; // "15:00"
  isClosed: boolean;
}

export interface GeneratedSlotDef {
  date: string; // YYYY-MM-DD
  startAt: Date;
  endAt: Date;
  startTimeLabel: string; // "10:00"
  endTimeLabel: string; // "10:15"
}

export interface SlotEvaluationParams {
  slot: {
    id?: string;
    date: Date | string;
    startAt: Date | string;
    endAt: Date | string;
    capacity: number;
    currentOrders: number;
    status: 'OPEN' | 'CLOSED';
  };
  now: Date;
  preparationMinutes: number;
  isTenantAcceptingOrders?: boolean;
  isTenantActive?: boolean;
}

export interface EvaluatedSlotResult {
  slotId?: string;
  date: string;
  startAt: string;
  endAt: string;
  startTimeLabel: string;
  endTimeLabel: string;
  capacity: number;
  currentOrders: number;
  remainingCapacity: number;
  isAvailable: boolean;
  reason?: string;
}

export class SlotPolicy {
  public static readonly DEFAULT_SLOT_DURATION_MINUTES = 15;
  public static readonly DEFAULT_MAX_ORDERS_PER_SLOT = 10;
  public static readonly DEFAULT_BOOKING_DAYS_AHEAD = 2;

  /**
   * Helper format 2 digit pad
   */
  private static pad2(n: number): string {
    return n.toString().padStart(2, '0');
  }

  /**
   * Parse time string "HH:mm" menjadi total menit dari 00:00
   */
  public static parseTimeToMinutes(timeStr: string): number {
    const parts = timeStr.split(':');
    const h = parseInt(parts[0] || '0', 10);
    const m = parseInt(parts[1] || '0', 10);
    return h * 60 + m;
  }

  /**
   * Format total menit menjadi "HH:mm"
   */
  public static formatMinutesToTime(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${this.pad2(h)}:${this.pad2(m)}`;
  }

  /**
   * Generate daftar interval slot waktu berdasarkan jam buka, jam tutup, dan durasi slot (menit).
   * Menghasilkan waktu dengan tanggal target (YYYY-MM-DD).
   */
  public static generateSlotsForDate(
    dateStr: string, // YYYY-MM-DD
    openTimeStr: string, // "10:00"
    closeTimeStr: string, // "15:00"
    slotDurationMinutes: number = SlotPolicy.DEFAULT_SLOT_DURATION_MINUTES
  ): GeneratedSlotDef[] {
    const startMinutes = this.parseTimeToMinutes(openTimeStr);
    const endMinutes = this.parseTimeToMinutes(closeTimeStr);

    if (endMinutes <= startMinutes || slotDurationMinutes <= 0) {
      return [];
    }

    const slots: GeneratedSlotDef[] = [];
    const [year, month, day] = dateStr.split('-').map((v) => parseInt(v, 10));

    for (let current = startMinutes; current + slotDurationMinutes <= endMinutes; current += slotDurationMinutes) {
      const next = current + slotDurationMinutes;
      const startH = Math.floor(current / 60);
      const startM = current % 60;
      const endH = Math.floor(next / 60);
      const endM = next % 60;

      const startAt = new Date(year, month - 1, day, startH, startM, 0, 0);
      const endAt = new Date(year, month - 1, day, endH, endM, 0, 0);

      slots.push({
        date: dateStr,
        startAt,
        endAt,
        startTimeLabel: `${this.pad2(startH)}:${this.pad2(startM)}`,
        endTimeLabel: `${this.pad2(endH)}:${this.pad2(endM)}`,
      });
    }

    return slots;
  }

  /**
   * Evaluasi apakah sebuah slot dapat dipilih oleh customer saat ini
   */
  public static evaluateAvailability(params: SlotEvaluationParams): EvaluatedSlotResult {
    const { slot, now, preparationMinutes, isTenantAcceptingOrders = true, isTenantActive = true } = params;

    const startAtDate = typeof slot.startAt === 'string' ? new Date(slot.startAt) : slot.startAt;
    const endAtDate = typeof slot.endAt === 'string' ? new Date(slot.endAt) : slot.endAt;

    const startHours = this.pad2(startAtDate.getHours());
    const startMins = this.pad2(startAtDate.getMinutes());
    const endHours = this.pad2(endAtDate.getHours());
    const endMins = this.pad2(endAtDate.getMinutes());

    const startTimeLabel = `${startHours}:${startMins}`;
    const endTimeLabel = `${endHours}:${endMins}`;

    const remainingCapacity = Math.max(0, slot.capacity - slot.currentOrders);

    let dateStr = '';
    if (typeof slot.date === 'string') {
      dateStr = slot.date.split('T')[0];
    } else {
      dateStr = `${slot.date.getFullYear()}-${this.pad2(slot.date.getMonth() + 1)}-${this.pad2(slot.date.getDate())}`;
    }

    // 1. Cek status tenant
    if (!isTenantActive) {
      return {
        slotId: slot.id,
        date: dateStr,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        startTimeLabel,
        endTimeLabel,
        capacity: slot.capacity,
        currentOrders: slot.currentOrders,
        remainingCapacity,
        isAvailable: false,
        reason: 'Tenant sedang tidak aktif atau dalam moderasi.',
      };
    }

    if (!isTenantAcceptingOrders) {
      return {
        slotId: slot.id,
        date: dateStr,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        startTimeLabel,
        endTimeLabel,
        capacity: slot.capacity,
        currentOrders: slot.currentOrders,
        remainingCapacity,
        isAvailable: false,
        reason: 'Tenant sedang tidak menerima pesanan baru sementara waktu.',
      };
    }

    // 2. Cek status slot manual
    if (slot.status === 'CLOSED') {
      return {
        slotId: slot.id,
        date: dateStr,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        startTimeLabel,
        endTimeLabel,
        capacity: slot.capacity,
        currentOrders: slot.currentOrders,
        remainingCapacity,
        isAvailable: false,
        reason: 'Waktu pengambilan ini telah ditutup oleh tenant.',
      };
    }

    // 3. Cek waktu persiapan (BR-07: slot_start >= now + preparation_time)
    const minLeadTimeMs = preparationMinutes * 60 * 1000;
    const earliestAllowedTime = new Date(now.getTime() + minLeadTimeMs);

    if (startAtDate < earliestAllowedTime) {
      return {
        slotId: slot.id,
        date: dateStr,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        startTimeLabel,
        endTimeLabel,
        capacity: slot.capacity,
        currentOrders: slot.currentOrders,
        remainingCapacity,
        isAvailable: false,
        reason:
          startAtDate < now
            ? 'Waktu pengambilan sudah lewat.'
            : `Terlalu dekat dengan waktu persiapan makanan (${preparationMinutes} menit).`,
      };
    }

    // 4. Cek kapasitas slot (BR-04: slot penuh jika current_orders >= capacity)
    if (slot.currentOrders >= slot.capacity) {
      return {
        slotId: slot.id,
        date: dateStr,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        startTimeLabel,
        endTimeLabel,
        capacity: slot.capacity,
        currentOrders: slot.currentOrders,
        remainingCapacity: 0,
        isAvailable: false,
        reason: 'Slot penuh. Silakan pilih waktu pengambilan lainnya.',
      };
    }

    // Slot memenuhi semua kriteria
    return {
      slotId: slot.id,
      date: dateStr,
      startAt: startAtDate.toISOString(),
      endAt: endAtDate.toISOString(),
      startTimeLabel,
      endTimeLabel,
      capacity: slot.capacity,
      currentOrders: slot.currentOrders,
      remainingCapacity,
      isAvailable: true,
    };
  }
}
