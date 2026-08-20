import { BellIcon, SearchIcon } from "../ui/dashboardIcons";

export function Topbar() {
  return (
    <header
      data-animate
      className="mb-6 flex w-full flex-col gap-4 bg-transparent sm:mb-8 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 className="font-bricolage text-xl font-light tracking-tight text-white sm:text-2xl md:text-3xl">
          Visão geral
        </h1>
        <p className="text-sm text-neutral-500">
          <br />
          Bem-vinda de volta — aqui está o resumo das suas turmas.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md md:flex">
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
          <input
            placeholder="Buscar avaliação, turma..."
            className="w-full min-w-0 bg-transparent text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none md:w-48"
          />
        </div>

        <button className="relative shrink-0 rounded-full border border-white/10 bg-white/5 p-2.5 text-neutral-300 transition-colors hover:bg-orange-500/20 hover:text-orange-400">
          <BellIcon className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
        </button>
      </div>
    </header>
  );
}
