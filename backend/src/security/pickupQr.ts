import {
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export function generatePickupQrToken() {
  return randomBytes(32)
    .toString("hex");
}

export function pickupQrMatches(
  expectedToken: string,
  scannedToken: string
) {
  const expected =
    Buffer.from(
      expectedToken,
      "utf8"
    );

  const scanned =
    Buffer.from(
      scannedToken,
      "utf8"
    );

  if (
    expected.length !==
    scanned.length
  ) {
    return false;
  }

  return timingSafeEqual(
    expected,
    scanned
  );
}