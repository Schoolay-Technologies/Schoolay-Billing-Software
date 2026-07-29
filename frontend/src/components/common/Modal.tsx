import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export default function Modal({
  title,
  children,
  onClose
}: ModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}