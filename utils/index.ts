export const formatSteps = (steps: number): string => {
  return steps.toLocaleString();
};

export const formatDday = (startDate: string): string => {
  const start = new Date(startDate);
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return `D+${diff}`;
};
