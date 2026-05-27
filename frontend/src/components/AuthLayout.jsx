import { motion } from 'framer-motion';
import Logo from './Logo';

const AuthIllustration = ({ variant = 'login' }) => (
  <div className="relative mt-14 w-[280px] h-[220px] mx-auto lg:mx-0">
    <div className="absolute inset-0 rounded-3xl bg-violet-600/10 blur-3xl" />
    <div className="relative flex items-end justify-center h-full">
      <div className="w-[200px] h-[130px] rounded-t-xl rounded-b-md bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600/80 shadow-2xl shadow-violet-900/30 flex flex-col overflow-hidden">
        <div className="h-3 bg-zinc-800 border-b border-zinc-700 flex items-center gap-1 px-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500/80" />
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/80" />
          <span className="w-1.5 h-1.5 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 p-3 font-mono text-[9px] leading-relaxed text-violet-300/90">
          <span className="text-violet-400">const</span> dev ={' '}
          <span className="text-emerald-400">true</span>;
          <br />
          <span className="text-violet-400">export</span> {'{'} code {'}'}
        </div>
      </div>
    </div>
    <div className="absolute top-6 right-4 w-11 h-11 rounded-xl bg-violet-600/40 border border-violet-400/30 flex items-center justify-center text-violet-200 text-sm font-mono shadow-lg shadow-violet-900/40">
      {'{ }'}
    </div>
    <div className="absolute top-16 left-0 w-11 h-11 rounded-xl bg-zinc-800/95 border border-zinc-600 flex items-center justify-center text-zinc-400 text-xs font-mono">
      &gt;_
    </div>
    <div className="absolute bottom-8 right-0 w-11 h-11 rounded-xl bg-zinc-800/95 border border-zinc-600 flex items-center justify-center text-violet-300 text-[10px] font-mono">
      &lt;/&gt;
    </div>
    <div className="absolute bottom-16 left-6 w-11 h-11 rounded-xl bg-violet-900/50 border border-violet-500/30 flex items-center justify-center text-violet-300">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </div>
    {variant === 'signup' && (
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-4xl">🚀</div>
    )}
  </div>
);

const AuthLayout = ({ headline, highlight, description, illustration = 'login', children }) => (
  <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0b10]">
    {/* Left panel — branding */}
    <div className="lg:w-1/2 flex flex-col p-8 lg:p-12 xl:p-14 min-h-[40vh] lg:min-h-screen">
      <Logo linkTo="/login" />
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto lg:mx-0 lg:ml-4 xl:ml-8 mt-10 lg:mt-0">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl lg:text-[2.75rem] xl:text-5xl font-bold text-white leading-[1.15] tracking-tight">
            {headline}
            <br />
            <span className="text-[#7c5cff]">{highlight}</span>
          </h1>
          <p className="text-zinc-500 mt-5 text-base lg:text-lg leading-relaxed max-w-md">
            {description}
          </p>
          <div className="hidden sm:block">
            <AuthIllustration variant={illustration} />
          </div>
        </motion.div>
      </div>
      <p className="text-zinc-600 text-sm mt-8 hidden lg:block">
        © 2026 CodeFusion. All rights reserved.
      </p>
    </div>

    {/* Right panel — form */}
    <div className="lg:w-1/2 flex items-center justify-center bg-[#12141d] p-6 sm:p-10 lg:p-12 min-h-[60vh] lg:min-h-screen">
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="w-full max-w-md"
      >
        {children}
      </motion.div>
    </div>

    <p className="lg:hidden text-center text-zinc-600 text-sm py-6 bg-[#12141d]">
      © 2026 CodeFusion. All rights reserved.
    </p>
  </div>
);

export default AuthLayout;
