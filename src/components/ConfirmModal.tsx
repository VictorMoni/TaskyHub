"use client";
import { useEffect, useRef, useId } from "react";
import Icon from "./Icon";

type ConfirmProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
    if (!isOpen && dialog?.open) dialog.close();
  }, [isOpen]);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby={headingId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <div className="dialog-symbol">
        <Icon name="trash" size={26} />
      </div>
      <h2 id={headingId}>{title}</h2>
      <p>{message}</p>
      <div className="dialog-actions">
        <button className="button" onClick={onCancel} autoFocus>
          Cancelar
        </button>
        <button className="button danger" onClick={onConfirm}>
          Confirmar
        </button>
      </div>
    </dialog>
  );
}
