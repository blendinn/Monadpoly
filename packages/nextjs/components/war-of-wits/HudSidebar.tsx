"use client";

type HudSidebarProps = {
  walletBalance: number;
  totalSpent: number;
  entryFee: number;
  sabotageSpent: number;
  isLobby: boolean;
};

export const HudSidebar = ({ walletBalance, totalSpent, entryFee, sabotageSpent, isLobby }: HudSidebarProps) => {
  return (
    <aside className="rounded-3xl border border-[#3fd4ff]/40 bg-black/40 p-4 backdrop-blur-xl shadow-[0_0_30px_rgba(63,212,255,0.25)]">
      <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Wallet Snapshot</p>
      <div className="mt-2 rounded-2xl border border-[#15ff7a]/50 bg-[#15ff7a]/10 p-3 shadow-[0_0_24px_rgba(21,255,122,0.35)]">
        <p className="text-xs text-[#adffcb]">Cuzdan Bakiyesi</p>
        <p className="text-2xl font-black tracking-wider text-[#15ff7a]">{walletBalance.toFixed(2)} MON</p>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 p-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/70">Harcanan MON (Oyun Ici)</p>
        <p className="mt-1 text-xl font-bold text-[#ffaf47]">{totalSpent.toFixed(2)} MON</p>
        <div className="mt-2 text-xs text-white/60">
          <p>Katilim Ucreti: {isLobby ? "0 MON (Test Mode)" : `${entryFee.toFixed(2)} MON`}</p>
          <p>Sabotaj Harcamasi: {sabotageSpent.toFixed(2)} MON</p>
        </div>
      </div>

      <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">
        Mock data shown, hooks ready for wiring
      </p>
    </aside>
  );
};
