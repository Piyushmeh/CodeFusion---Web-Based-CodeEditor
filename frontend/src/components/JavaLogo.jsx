const JavaLogo = ({ size = 40, className = '' }) => (
  <div
    className={`relative flex items-center justify-center shrink-0 ${className}`}
    style={{ width: size, height: size }}
  >
    <div
      className="absolute inset-0 rounded-xl opacity-40 blur-md"
      style={{ background: 'linear-gradient(135deg, #f89820, #e76f00)' }}
    />
    <div
      className="relative w-full h-full rounded-xl flex items-center justify-center border border-orange-400/40 shadow-lg"
      style={{
        background: 'linear-gradient(145deg, #5382a1 0%, #2d6a9f 35%, #f89820 65%, #e76f00 100%)',
        boxShadow: '0 4px 20px rgba(248, 152, 32, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
      }}
    >
      <svg viewBox="0 0 48 48" className="w-[70%] h-[70%]" fill="none">
        <path
          d="M18 32c-4-2-6-6-6-10 0-2 1-4 3-5l2 3c-1 1-2 2-2 4 0 3 2 6 5 8l-2 0z"
          fill="white"
          fillOpacity="0.9"
        />
        <path
          d="M28 12c4 2 6 6 6 10 0 2-1 4-3 5l-2-3c1-1 2-2 2-4 0-3-2-6-5-8l2 0z"
          fill="white"
          fillOpacity="0.75"
        />
        <ellipse cx="24" cy="26" rx="8" ry="5" fill="white" fillOpacity="0.95" />
        <text
          x="24"
          y="29"
          textAnchor="middle"
          fill="#c2410c"
          fontSize="11"
          fontWeight="bold"
          fontFamily="system-ui,sans-serif"
        >
          J
        </text>
      </svg>
    </div>
  </div>
);

export default JavaLogo;
