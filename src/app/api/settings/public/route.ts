import { apiSuccess } from '@/server/http/response';
import { handleRouteError } from '@/server/http/error-handler';
import { SystemSettingService } from '@/server/services/system-setting.service';

export const dynamic = 'force-dynamic';

/**
 * Mengembalikan pengaturan operasional publik non-rahasia (biaya layanan, TTL bayar, mode pemeliharaan).
 */
export async function GET() {
  try {
    const settings = await SystemSettingService.getSettings();
    return apiSuccess(settings);
  } catch (error) {
    return handleRouteError(error);
  }
}
