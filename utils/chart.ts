// utils/chart.ts

export const ChartUtils = {
  /**
   * Formatar valor em reais
   */
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  },

  /**
   * Formatar valor compacto (K, M)
   */
  formatCompact: (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  },

  /**
   * Gerar pontos do gráfico com padding
   */
  generateChartPoints: (data: number[], width: number, height: number) => {
    if (data.length === 0) return [];

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    const paddingX = width * 0.05;
    const paddingY = height * 0.1;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    return data.map((value, index) => {
      const x = paddingX + (index / (data.length - 1 || 1)) * chartWidth;
      const y = height - paddingY - ((value - min) / range) * chartHeight;
      return { x, y, value };
    });
  },

  /**
   * Gerar path SVG suave (smooth curve)
   */
  generateSmoothPath: (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;

      path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
  },
};