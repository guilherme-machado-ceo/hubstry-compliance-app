/**
 * Logo Hubstry.
 *
 * - variant="light": versão branca, para fundos escuros
 * - variant="dark":  versão preta original, para fundos claros
 * - variant="auto":  segue o tema do app (classe `dark` no <html>)
 *
 * As imagens ficam em client/public/brand/ e não devem ser editadas.
 */
const LOGO_RATIO = 1600 / 196;

interface BrandLogoProps {
  variant?: "auto" | "light" | "dark";
  /** Altura em pixels; a largura é calculada pela proporção do logo. */
  height?: number;
  className?: string;
}

export function BrandLogo({ variant = "auto", height = 20, className = "" }: BrandLogoProps) {
  const width = Math.round(height * LOGO_RATIO);
  const common = { alt: "Hubstry", width, height, decoding: "async" as const };

  if (variant === "light") {
    return <img src="/brand/hubstry-logo-light.png" className={className} {...common} />;
  }
  if (variant === "dark") {
    return <img src="/brand/hubstry-logo.png" className={className} {...common} />;
  }
  return (
    <>
      <img src="/brand/hubstry-logo.png" className={`dark:hidden ${className}`} {...common} />
      <img src="/brand/hubstry-logo-light.png" className={`hidden dark:block ${className}`} {...common} />
    </>
  );
}
