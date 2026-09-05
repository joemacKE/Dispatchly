type Props = {
  title: string;
  qrValue: string;
  onClose: () => void;
};

export default function QrModal({ title, qrValue, onClose }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal qr-modal">
        <button type="button" className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2>{title}</h2>

        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            qrValue,
          )}`}
          alt="QR Code"
        />

        <button className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
