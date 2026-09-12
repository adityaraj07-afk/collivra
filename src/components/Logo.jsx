export default function Logo({ dark = false, size = 'md' }) {
  const isLg = size === 'lg'
  return (
    <div className="flex items-center gap-2">
      <svg width={isLg ? 30 : 22} height={isLg ? 30 : 22} viewBox="0 0 24 24" fill="none">
        <path d="M12 22c0-6 2-10 8-12-1 8-4 11-8 12z" fill={dark ? '#95D5B2' : '#2D6A4F'} />
        <path d="M12 22C8 20 4 16 4 10c0-4 3-8 8-8s8 4 8 8" stroke={dark ? '#74C69D' : '#40916C'} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      <span
        className={`font-bold tracking-[1px] ${isLg ? 'text-2xl' : 'text-[17px]'}`}
        style={{ color: dark ? '#FFFFFF' : '#1B4332' }}
      >
        COLLIVRA
      </span>
    </div>
  )
}
