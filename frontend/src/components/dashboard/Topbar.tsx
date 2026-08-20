import { BellIcon, PlusIcon, SearchIcon } from "../ui/dashboardIcons";

export function Topbar() {
  return (
    <header
      data-animate
      className="mb-8 flex w-full items-center justify-between gap-4 bg-transparent"
    >
      <div>
        <h1 className="font-bricolage text-2xl font-light tracking-tight text-white sm:text-3xl">
          Visão geral
        </h1>
        <p className="text-sm text-neutral-500">
          Bem-vinda de volta — aqui está o resumo das suas turmas.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md sm:flex">
          <SearchIcon className="h-3.5 w-3.5 text-neutral-500" />
          <input
            placeholder="Buscar avaliação, turma..."
            className="w-48 bg-transparent text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none"
          />
        </div>

        <button className="relative rounded-full border border-white/10 bg-white/5 p-2.5 text-neutral-300 transition-colors hover:text-white">
          <BellIcon className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
        </button>

        <button className="flex items-center gap-2 rounded-full bg-gradient-to-t from-yellow-200 via-orange-400 to-orange-500 px-4 py-2.5 text-xs font-medium text-[#2c1306] shadow-[0_0_25px_-5px_rgba(249,115,22,0.6)] ring-1 ring-inset ring-white/40 transition-transform hover:scale-105">
          <PlusIcon className="h-3.5 w-3.5" />
          Nova avaliação
        </button>
      </div>
    </header>
  );
}
