export function ConfirmModal({
  title,
  description,
  confirmLabel,
  busy,
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
        <h2 className="font-bricolage text-lg font-light text-white">{title}</h2>
        <p className="mt-2 text-sm text-neutral-400">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-full px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-full px-4 py-2 text-xs font-medium ring-1 transition disabled:opacity-50 ${
              danger || confirmLabel.toLowerCase().includes("anular")
                ? "bg-red-500/10 text-red-400 ring-red-500/20 hover:bg-red-500/20"
                : "bg-orange-500/10 text-orange-400 ring-orange-500/20 hover:bg-orange-500/20"
            }`}
          >
            {busy ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
