interface LoadingBarProps {
  progress: number;
  className?: string;
}

export function LoadingBar({ progress, className }: LoadingBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div
      className={className ? `loading-bar ${className}` : "loading-bar"}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label="Progress"
    >
      <div className="loading-bar__fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}
