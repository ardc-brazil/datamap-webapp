const SIZES = {
  sm: { mark: "h-6 w-6", word: "text-[19px]", gap: "gap-2" },
  md: { mark: "h-7 w-7", word: "text-[22px]", gap: "gap-[9px]" },
  lg: { mark: "h-8 w-8", word: "text-[25px]", gap: "gap-2.5" },
};

interface LogoProps {
  size?: keyof typeof SIZES;
  inverse?: boolean;
  className?: string;
}

export function Logo({ size = "lg", inverse = false, className = "" }: LogoProps) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <img
        src={inverse ? "/img/brand/datamap-mark-inverse.svg" : "/img/brand/datamap-mark.svg"}
        alt=""
        className={`${s.mark} block`}
      />
      <span
        className={`${s.word} font-semibold leading-none tracking-[-0.035em] ${inverse ? "text-primary-50" : "text-primary-900"}`}
      >
        datamap
      </span>
      <span className="sr-only">DataMap</span>
    </span>
  );
}
