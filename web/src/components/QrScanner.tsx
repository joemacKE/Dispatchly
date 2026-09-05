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
  instruction = "Point the camera at the Reflex QR code.",
}: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const completedRef = useRef(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const scanner = new Html5Qrcode("reflex-qr-reader", {
      verbose: false,

      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    });

    scannerRef.current = scanner;

    async function startScanner() {
      try {
        await scanner.start(
          {
            facingMode: {
              exact: "environment",
            },
          },

          {
            fps: 15,

            qrbox: {
              width: 320,
              height: 320,
            },

            aspectRatio: 1,
          },

          async (decodedText) => {
            if (completedRef.current) {
              return;
            }

            completedRef.current = true;

            try {
              if (scanner.isScanning) {
                await scanner.stop();
              }
            } catch {
              // ignore stop race
            }

            onScan(decodedText);
          },

          () => {
            // ignore frames without QR
          },
        );
      } catch (error) {
        /*
          Some browsers reject
          exact environment.
          Retry normally.
        */

        try {
          await scanner.start(
            {
              facingMode: "environment",
            },

            {
              fps: 15,

              qrbox: {
                width: 320,
                height: 320,
              },
            },

            (decodedText) => {
              if (completedRef.current) {
                return;
              }

              completedRef.current = true;

              void scanner.stop();

              onScan(decodedText);
            },

            () => {},
          );
        } catch (secondError) {
          setError(
            secondError instanceof Error
              ? secondError.message
              : "Unable to start camera",
          );
        }
      }
    }

    void startScanner();

    return () => {
      completedRef.current = true;

      if (scanner.isScanning) {
        void scanner.stop().catch(() => {});
      }

      scanner.clear();
    };
  }, [onScan]);

  async function closeScanner() {
    completedRef.current = true;

    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch {
      // ignore
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

          <button
            type="button"
            className="scanner-close"
            onClick={() => void closeScanner()}
          >
            ×
          </button>
        </div>

        <div id="reflex-qr-reader" className="qr-reader" />

        {error && <div className="error-box">{error}</div>}

        <p className="scanner-help">
          Camera access is used only while this scanner is open.
        </p>

        <button
          type="button"
          className="secondary-button scanner-cancel"
          onClick={() => void closeScanner()}
        >
          Cancel
        </button>
      </section>
    </div>
  );
}
