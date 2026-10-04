import {
  PaymentProvider,
  CreateChargeRequest,
  CreateChargeResponse,
  RefundRequest,
  RefundResponse,
} from './payment-provider.interface';

export class MockPaymentProvider implements PaymentProvider {
  public async createCharge(req: CreateChargeRequest): Promise<CreateChargeResponse> {
    const reference = `MOCK-PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    let qrPayload: string | undefined;
    let vaNumber: string | undefined;
    const instructions: string[] = [];

    switch (req.method) {
      case 'QRIS':
        qrPayload = `00020101021226680016ID.FOODQUEUE.MOCK0118FQ${req.orderNumber}520458125303360540${req.amount}5802ID5913FOODQUEUE KAMPUS6007JAKARTA6304`;
        instructions.push('Buka aplikasi m-Banking atau e-Wallet yang mendukung QRIS.');
        instructions.push('Pindai QR code di bawah.');
        instructions.push('Periksa nama merchant FoodQueue dan nominal pembayaran.');
        instructions.push('Tekan tombol simulasi untuk menyelesaikan pembayaran.');
        break;

      case 'VIRTUAL_ACCOUNT':
        vaNumber = `8808${Math.floor(10000000 + Math.random() * 90000000)}`;
        instructions.push(`Transfer ke Virtual Account: ${vaNumber}`);
        instructions.push('Nama Akun: FoodQueue Kampus');
        instructions.push('Nominal transfer harus tepat sama.');
        instructions.push('Tekan tombol simulasi untuk konfirmasi pembayaran.');
        break;

      case 'EWALLET':
        instructions.push('Buka aplikasi dompet digital Anda.');
        instructions.push('Konfirmasi pembayaran pada notifikasi masuk.');
        instructions.push('Tekan tombol simulasi untuk menyelesaikan transaksi.');
        break;
    }

    return {
      transactionReference: reference,
      provider: 'MOCK',
      qrPayload,
      vaNumber,
      instructions,
    };
  }

  public async refund(req: RefundRequest): Promise<RefundResponse> {
    return {
      refundId: `MOCK-REFUND-${Date.now()}`,
      status: 'SUCCESS',
      message: `Simulasi pengembalian dana Rp ${req.amount} untuk transaksi ${req.transactionReference} berhasil.`,
    };
  }
}

export const defaultPaymentProvider = new MockPaymentProvider();
