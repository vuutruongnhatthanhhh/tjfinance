import { PayOS } from "@payos/node";

let payOSInstance: PayOS | null = null;

export function getPayOS() {
  if (payOSInstance) {
    return payOSInstance;
  }

  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error("Thiếu cấu hình PayOS.");
  }

  payOSInstance = new PayOS({
    clientId,
    apiKey,
    checksumKey,
  });

  return payOSInstance;
}
