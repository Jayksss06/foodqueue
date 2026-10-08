import { OrderStatus, Role } from '@/types';

export type ActorRole = Role | 'SYSTEM';

interface TransitionRule {
  from: OrderStatus;
  to: OrderStatus;
  allowedActors: ActorRole[];
  description: string;
}

export const ORDER_TRANSITIONS: TransitionRule[] = [
  // Checkout creation -> PENDING_PAYMENT (initial state)
  {
    from: 'PENDING_PAYMENT',
    to: 'PAID',
    allowedActors: ['SYSTEM', 'ADMIN', 'CUSTOMER'],
    description: 'Pembayaran order terkonfirmasi berhasil',
  },
  {
    from: 'PENDING_PAYMENT',
    to: 'CANCELLED',
    allowedActors: ['CUSTOMER', 'SYSTEM', 'ADMIN'],
    description: 'Order dibatalkan atau waktu pembayaran kedaluwarsa',
  },
  {
    from: 'PAID',
    to: 'ACCEPTED',
    allowedActors: ['TENANT', 'ADMIN'],
    description: 'Tenant menerima order untuk diproses',
  },
  {
    from: 'PAID',
    to: 'REJECTED',
    allowedActors: ['TENANT', 'ADMIN'],
    description: 'Tenant menolak order (stok habis mendadak atau dapur overload)',
  },
  {
    from: 'PAID',
    to: 'CANCELLED',
    allowedActors: ['CUSTOMER', 'ADMIN'],
    description: 'Customer membatalkan order sebelum diterima oleh tenant',
  },
  {
    from: 'ACCEPTED',
    to: 'PREPARING',
    allowedActors: ['TENANT', 'ADMIN'],
    description: 'Tenant mulai memasak/menyiapkan makanan',
  },
  {
    from: 'PREPARING',
    to: 'READY_FOR_PICKUP',
    allowedActors: ['TENANT', 'ADMIN'],
    description: 'Makanan selesai disiapkan dan siap diambil di counter',
  },
  {
    from: 'READY_FOR_PICKUP',
    to: 'COMPLETED',
    allowedActors: ['TENANT', 'ADMIN'],
    description: 'Customer mengambil makanan dan kode pickup berhasil diverifikasi',
  },
  {
    from: 'READY_FOR_PICKUP',
    to: 'NO_SHOW',
    allowedActors: ['TENANT', 'ADMIN'],
    description: 'Customer tidak hadir mengambil order setelah batas toleransi waktu (grace period)',
  },
  {
    from: 'REJECTED',
    to: 'REFUNDED',
    allowedActors: ['SYSTEM', 'ADMIN'],
    description: 'Dana otomatis dikembalikan setelah order ditolak',
  },
  {
    from: 'CANCELLED',
    to: 'REFUNDED',
    allowedActors: ['SYSTEM', 'ADMIN'],
    description: 'Dana otomatis dikembalikan setelah order yang sudah dibayar dibatalkan',
  },
];

export class InvalidOrderTransitionError extends Error {
  constructor(
    public from: OrderStatus,
    public to: OrderStatus,
    public actor: ActorRole,
    message?: string
  ) {
    super(
      message ||
        `Perubahan status order dari '${from}' ke '${to}' oleh actor '${actor}' tidak diizinkan.`
    );
    this.name = 'InvalidOrderTransitionError';
  }
}

export class OrderStateMachine {
  /**
   * Mengecek apakah transisi status diizinkan berdasarkan status saat ini, tujuan, dan role aktor
   */
  public static canTransition(from: OrderStatus, to: OrderStatus, actor: ActorRole): boolean {
    return ORDER_TRANSITIONS.some(
      (rule) =>
        rule.from === from &&
        rule.to === to &&
        rule.allowedActors.includes(actor)
    );
  }

  /**
   * Menegakkan aturan transisi. Melempar InvalidOrderTransitionError jika tidak diizinkan.
   */
  public static assertTransition(from: OrderStatus, to: OrderStatus, actor: ActorRole): void {
    if (!this.canTransition(from, to, actor)) {
      throw new InvalidOrderTransitionError(from, to, actor);
    }
  }

  /**
   * Apakah customer masih boleh membatalkan order ini?
   * Sesuai BR-10: Hanya saat PENDING_PAYMENT atau PAID (sebelum diterima tenant).
   */
  public static isCancellableByCustomer(status: OrderStatus): boolean {
    return status === 'PENDING_PAYMENT' || status === 'PAID';
  }

  /**
   * Apakah transisi ke status ini menandakan reservasi slot dan stok harus dilepaskan?
   * Mencegah pelepasan ganda jika status asal sudah pernah melepaskan reservasi (misal CANCELLED -> REFUNDED).
   */
  public static releasesReservation(
    fromOrTargetStatus: OrderStatus,
    targetStatus?: OrderStatus
  ): boolean {
    if (targetStatus === undefined) {
      return (
        fromOrTargetStatus === 'CANCELLED' ||
        fromOrTargetStatus === 'REJECTED' ||
        fromOrTargetStatus === 'REFUNDED'
      );
    }

    const fromStatus = fromOrTargetStatus;
    const isTargetRelease =
      targetStatus === 'CANCELLED' ||
      targetStatus === 'REJECTED' ||
      targetStatus === 'REFUNDED';
    const wasAlreadyReleased =
      fromStatus === 'CANCELLED' ||
      fromStatus === 'REJECTED' ||
      fromStatus === 'REFUNDED';

    return isTargetRelease && !wasAlreadyReleased;
  }

  /**
   * Apakah order ini sudah berstatus terminal (tidak dapat diubah lagi statusnya)?
   */
  public static isTerminal(status: OrderStatus): boolean {
    return status === 'COMPLETED' || status === 'REFUNDED' || status === 'NO_SHOW';
  }

  /**
   * Apakah order ini memerlukan proses refund jika dibatalkan/ditolak?
   */
  public static requiresRefund(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
    if (targetStatus === 'REJECTED') return true;
    if (targetStatus === 'CANCELLED' && currentStatus === 'PAID') return true;
    return false;
  }
}
