import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Html5Qrcode,
} from "html5-qrcode";

type Props = {
  onScan: (
    qrValue: string
  ) => void;

  onCancel: () => void;

  title?: string;

  instruction?: string;
};

export default function QrScanner({
  onScan,
  onCancel,
  title = "Scan Delivery QR",
  instruction =
    "Point the camera at the customer's Reflex QR code.",
}: Props) {
  const scannerRef =
    useRef<Html5Qrcode | null>(
      null
    );

  const completedRef =
    useRef(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const scanner =
      new Html5Qrcode(
        "reflex-qr-reader"
      );

    scannerRef.current =
      scanner;

    async function start() {
      try {
        await scanner.start(
          {
            facingMode:
              "environment",
          },

          {
            fps: 10,

            qrbox: {
              width: 250,
              height: 250,
            },
          },

          async (
            decodedText
          ) => {
            if (
              completedRef.current
            ) {
              return;
            }

            completedRef.current =
              true;

            try {
              if (
                scanner.isScanning
              ) {
                await scanner.stop();
              }
            } catch {
              // Scanner may already
              // have stopped.
            }

            onScan(decodedText);
          },

          () => {
            /*
             * Frames without a
             * QR code are normal.
             */
          }
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to start camera"
        );
      }
    }

    void start();

    return () => {
      completedRef.current =
        true;

      const current =
        scannerRef.current;

      if (!current) {
        return;
      }

      if (current.isScanning) {
        void current
          .stop()
          .catch(() => {
            // Ignore shutdown race.
          });
      }
    };
  }, [onScan]);

  async function closeScanner() {
    completedRef.current =
      true;

    try {
      if (
        scannerRef.current
          ?.isScanning
      ) {
        await scannerRef.current
          .stop();
      }
    } catch {
      // Safe to ignore.
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
            onClick={() =>
              void closeScanner()
            }
          >
            ×
          </button>
        </div>

        <div
          id="reflex-qr-reader"
          className="qr-reader"
        />

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <p className="scanner-help">
          Camera access is used only
          while this scanner is open.
        </p>

        <button
          type="button"
          className="secondary-button scanner-cancel"
          onClick={() =>
            void closeScanner()
          }
        >
          Cancel
        </button>
      </section>
    </div>
  );
}
