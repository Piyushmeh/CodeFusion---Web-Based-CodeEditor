const AuthFormCard = ({ title, subtitle, children, footer }) => (
  <div className="rounded-2xl border border-zinc-800/60 bg-[#161922]/90 p-8 shadow-xl shadow-black/25">
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-zinc-500 text-sm mt-2 leading-relaxed">{subtitle}</p>}
    </div>
    {children}
    {footer}
  </div>
);

export const AuthField = ({ label, icon: Icon, children }) => (
  <div>
    <label className="text-sm font-medium text-zinc-300 block mb-2">{label}</label>
    <div className="relative">
      {Icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <Icon className="w-[18px] h-[18px] text-zinc-500" strokeWidth={1.75} />
        </div>
      )}
      {children}
    </div>
  </div>
);

export const authInputClass =
  'w-full h-11 bg-[#0d0f14] border border-zinc-700/90 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff]/40 transition';

export default AuthFormCard;
