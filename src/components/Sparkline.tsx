interface SparklineProps {
  data: number[];
}

export const Sparkline = ({ data }: SparklineProps) => {
  if (data.length < 2) return <div className="w-16 h-4" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 60},${16 - ((v - min) / range) * 16}`).join(' ');
  
  return (
    <svg className="w-16 h-4 opacity-40 group-hover:opacity-100 transition-opacity" viewBox="0 0 60 16">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};
