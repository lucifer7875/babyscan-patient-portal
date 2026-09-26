import logoUrl from '@/assets/logo.webp'

interface BrandLogoProps {
  size?: number
  className?: string
}

export function BrandLogo({ size = 40, className }: BrandLogoProps) {
  return (
    <img
      src={logoUrl}
      width={Math.round(size * 0.711)}
      height={size}
      alt="Baby Scan"
      className={className}
      draggable={false}
      decoding="async"
    />
  )
}
