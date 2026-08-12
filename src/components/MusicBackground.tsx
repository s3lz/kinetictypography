interface MusicBackgroundProps {
  variant?: "light" | "dense";
}

export function MusicBackground({ variant = "light" }: MusicBackgroundProps) {
  const notes = variant === "dense" ? 8 : 6;

  return (
    <div className="music-bg" aria-hidden="true">
      {Array.from({ length: notes }, (_, index) => (
        <div
          key={index}
          className={`music-bg__note music-bg__note--${index + 1}`}
        />
      ))}
    </div>
  );
}
