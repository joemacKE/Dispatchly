const handleScan = useCallback(
  (value: string) => {
    const cleanedValue = value
      .trim()
      .replace(/[\r\n\t]/g, "")
      .replace(/\s+/g, "");

    console.log("SCANNED QR VALUE:", cleanedValue);

    setShowScanner(false);

    if (!cleanedValue) {
      setError("The scanned QR code is empty.");

      return;
    }

    if (scanMode === "pickup") {
      void verifyPickupQr(cleanedValue);

      return;
    }

    setQrToken(cleanedValue);

    setShowPod(true);

    setError("");
  },
  [scanMode, delivery, online, onVerifyPickup],
);
