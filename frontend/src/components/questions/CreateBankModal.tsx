import { useState, type FormEvent } from "react";
import { XIcon } from "../ui/dashboardIcons";
import type { BankVisibility } from "../../lib/api";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#050505] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-orange-500/50 focus:outline-none";

export function CreateBankModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { name: string; visibility: BankVisibility }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<BankVisibility>("PRIVATE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onCreate({ name, visibility });
    } catch {
      setError("Não foi possível criar o banco. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-3 py-6 backdrop-blur-sm sm:px-4 sm:py-8">
      <div className="electric-card relative w-full max-w-sm overflow-hidden rounded-[24px] bg-neutral-900 p-[2px] sm:rounded-[28px]">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent opacity-60" />
        <div className="relative z-10 rounded-[22px] bg-[#0A0A0A] p-5 sm:rounded-[26px] sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bricolage text-xl font-light tracking-tight text-white">Novo banco</h2>
            <button onClick={onClose} className="text-neutral-500 transition-colors hover:text-white" aria-label="Fechar">
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-xs text-neutral-400">Nome do banco</label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: História — 9º ano"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-neutral-400">Visibilidade</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-neutral-300">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "PRIVATE"}
                    onChange={() => setVisibility("PRIVATE")}
                    className="h-4 w-4 border-white/20 bg-transparent text-orange-500 focus:ring-0"
                  />
                  Privado
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-300">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "PUBLIC"}
                    onChange={() => setVisibility("PUBLIC")}
                    className="h-4 w-4 border-white/20 bg-transparent text-orange-500 focus:ring-0"
                  />
                  Público
                </label>
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-600">
                Bancos públicos podem ser vistos e usados em provas por outros professores, mas só você edita.
              </p>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-xs text-neutral-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-gradient-to-t from-yellow-200 via-orange-400 to-orange-500 px-6 py-2.5 text-xs font-medium text-[#2c1306] ring-1 ring-inset ring-white/40 transition-transform hover:scale-105 disabled:opacity-50 sm:py-2"
              >
                {submitting ? "Criando…" : "Criar banco"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
