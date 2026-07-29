interface AlertProps {
  type: "success" | "error";
  message: string;
  onClose?: () => void;
}

export default function Alert({
  type,
  message,
  onClose
}: AlertProps) {
  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>

      {onClose && (
        <button
          type="button"
          className="alert-close"
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
}