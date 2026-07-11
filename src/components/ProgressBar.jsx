export default function ProgressBar({value, max, color="var(--accent)", h=3}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="progress-track" style={{height: h}}>
      <div className="progress-fill" style={{width: `${pct}%`, background: color}} />
    </div>
  );
}
