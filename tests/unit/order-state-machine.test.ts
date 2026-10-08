import { describe, it, expect } from 'vitest';
import {
  OrderStateMachine,
  InvalidOrderTransitionError,
} from '@/server/domain/order-state-machine';

describe('OrderStateMachine Domain Unit Tests', () => {
  it('should allow valid transition from PENDING_PAYMENT to PAID by SYSTEM or CUSTOMER', () => {
    expect(OrderStateMachine.canTransition('PENDING_PAYMENT', 'PAID', 'SYSTEM')).toBe(true);
    expect(OrderStateMachine.canTransition('PENDING_PAYMENT', 'PAID', 'CUSTOMER')).toBe(true);
    expect(OrderStateMachine.canTransition('PENDING_PAYMENT', 'PAID', 'ADMIN')).toBe(true);
  });

  it('should allow customer to cancel order during PENDING_PAYMENT', () => {
    expect(OrderStateMachine.canTransition('PENDING_PAYMENT', 'CANCELLED', 'CUSTOMER')).toBe(true);
    expect(OrderStateMachine.isCancellableByCustomer('PENDING_PAYMENT')).toBe(true);
  });

  it('should allow customer to cancel order during PAID', () => {
    expect(OrderStateMachine.canTransition('PAID', 'CANCELLED', 'CUSTOMER')).toBe(true);
    expect(OrderStateMachine.isCancellableByCustomer('PAID')).toBe(true);
  });

  it('should disallow customer from cancelling once tenant has ACCEPTED', () => {
    expect(OrderStateMachine.canTransition('ACCEPTED', 'CANCELLED', 'CUSTOMER')).toBe(false);
    expect(OrderStateMachine.isCancellableByCustomer('ACCEPTED')).toBe(false);
    expect(() =>
      OrderStateMachine.assertTransition('ACCEPTED', 'CANCELLED', 'CUSTOMER')
    ).toThrowError(InvalidOrderTransitionError);
  });

  it('should allow tenant to progress order: PAID -> ACCEPTED -> PREPARING -> READY_FOR_PICKUP -> COMPLETED', () => {
    expect(OrderStateMachine.canTransition('PAID', 'ACCEPTED', 'TENANT')).toBe(true);
    expect(OrderStateMachine.canTransition('ACCEPTED', 'PREPARING', 'TENANT')).toBe(true);
    expect(OrderStateMachine.canTransition('PREPARING', 'READY_FOR_PICKUP', 'TENANT')).toBe(true);
    expect(OrderStateMachine.canTransition('READY_FOR_PICKUP', 'COMPLETED', 'TENANT')).toBe(true);
  });

  it('should disallow skipping steps, e.g. PAID directly to READY_FOR_PICKUP', () => {
    expect(OrderStateMachine.canTransition('PAID', 'READY_FOR_PICKUP', 'TENANT')).toBe(false);
    expect(() =>
      OrderStateMachine.assertTransition('PAID', 'READY_FOR_PICKUP', 'TENANT')
    ).toThrow(InvalidOrderTransitionError);
  });

  it('should disallow tenant from moving COMPLETED order back to any status', () => {
    expect(OrderStateMachine.canTransition('COMPLETED', 'PREPARING', 'TENANT')).toBe(false);
    expect(OrderStateMachine.isTerminal('COMPLETED')).toBe(true);
  });

  it('should correctly determine when inventory reservation must be released', () => {
    expect(OrderStateMachine.releasesReservation('CANCELLED')).toBe(true);
    expect(OrderStateMachine.releasesReservation('REJECTED')).toBe(true);
    expect(OrderStateMachine.releasesReservation('REFUNDED')).toBe(true);
    expect(OrderStateMachine.releasesReservation('ACCEPTED')).toBe(false);
    expect(OrderStateMachine.releasesReservation('COMPLETED')).toBe(false);

    // Two-parameter tests (anti double-release)
    expect(OrderStateMachine.releasesReservation('PAID', 'CANCELLED')).toBe(true);
    expect(OrderStateMachine.releasesReservation('PAID', 'REJECTED')).toBe(true);
    expect(OrderStateMachine.releasesReservation('PENDING_PAYMENT', 'CANCELLED')).toBe(true);
    // Already released when entering CANCELLED/REJECTED, so REFUNDED must NOT release again
    expect(OrderStateMachine.releasesReservation('CANCELLED', 'REFUNDED')).toBe(false);
    expect(OrderStateMachine.releasesReservation('REJECTED', 'REFUNDED')).toBe(false);
  });

  it('should correctly flag required refund when rejected or cancelled after paid', () => {
    expect(OrderStateMachine.requiresRefund('PAID', 'REJECTED')).toBe(true);
    expect(OrderStateMachine.requiresRefund('PAID', 'CANCELLED')).toBe(true);
    expect(OrderStateMachine.requiresRefund('PENDING_PAYMENT', 'CANCELLED')).toBe(false);
  });

  it('should allow tenant to mark NO_SHOW after READY_FOR_PICKUP', () => {
    expect(OrderStateMachine.canTransition('READY_FOR_PICKUP', 'NO_SHOW', 'TENANT')).toBe(true);
    expect(OrderStateMachine.isTerminal('NO_SHOW')).toBe(true);
  });
});
