const BACKEND_HOST = process.env.EXPO_PUBLIC_BACKEND_HOST || process.env.EXPO_PUBLIC_API_IP || '127.0.0.1';
const BACKEND_URL = `http://${BACKEND_HOST}:3000/api/v1/verify`;

export type VerificationPayload = Record<string, unknown> & {
  client_telemetry?: Record<string, unknown>;
};

interface VerificationResult {
  ok: boolean;
  result?: any;
  error?: string;
  details?: any;
}

export const useVerificationRequest = () => {
  const executeVerificationRequest = async (payload: VerificationPayload): Promise<VerificationResult> => {
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseBody = await response.json();

      if (response.ok) {
        return { ok: true, result: responseBody };
      }

      return {
        ok: false,
        error: responseBody.error?.message || 'Verification rejected.',
        details: responseBody.error?.details,
      };
    } catch {
      return {
        ok: false,
        error: 'Network communication timeout failure.',
      };
    }
  };

  return { executeVerificationRequest };
};
