import { useEffect, useRef, useState } from "react";

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

type Props = {
  onScan: (qrValue: string) => void;
  onCancel: () => void;
  title?: string;
  instruction?: string;
};

export default function QrScanner({
  onScan,
  onCancel,
  title = "Scan QR Code",
  instruction = "Point the camera at the QR code.",
}: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const scanningRef = useRef(false);

  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        const scanner = new Html5Qrcode("reflex-qr-reader", {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        });

        scannerRef.current = scanner;

        await scanner.start(
          {
            facingMode: "environment",
          },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          async (decodedText) => {
            if (!mounted || scanningRef.current) {
              return;
            }

            scanningRef.current = true;

            console.log("QR SCANNED:", decodedText);

            try {
              if (scanner.isScanning) {
                await scanner.stop();
              }
            } catch {}

            onScan(decodedText);
          },
          () => {},
        );
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to start camera",
        );
      }
    }

    void start();

    return () => {
      mounted = false;

      const scanner = scannerRef.current;

      if (scanner?.isScanning) {
        void scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [onScan]);

  async function closeScanner() {
    const scanner = scannerRef.current;

    if (scanner?.isScanning) {
      try {
        await scanner.stop();
      } catch {}
    }

    onCancel();
  }

  return (
    <div className="scanner-overlay">
      <section className="scanner-modal">
        <div className="scanner-heading">
          <div>
            <h3>{title}</h3>

            <p>{instruction}</p>
          </div>

          <button className="scanner-close" onClick={() => void closeScanner()}>
            ×
          </button>
        </div>

        <div id="reflex-qr-reader" className="qr-reader" />

        {error && <div className="error-box">{error}</div>}
      </section>
    </div>
  );
}
