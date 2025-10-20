// components/analytics/FlowChart.tsx

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '@/theme';
import { DailyFlow } from '@/types/analytics';
import { ChartUtils } from '@/utils/chart';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface FlowChartProps {
  data: DailyFlow[];
  color: string;
  title: string;
}

const CHART_WIDTH = Dimensions.get('window').width - Spacing.base * 2;
const CHART_HEIGHT = 200;

export function FlowChart({ data, color, title }: FlowChartProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Sem dados para este período
          </Text>
        </View>
      </View>
    );
  }

  const amounts = data.map(d => d.amount);
  const maxAmount = Math.max(...amounts, 1);
  const totalAmount = amounts.reduce((sum, val) => sum + val, 0);

  const points = ChartUtils.generateChartPoints(amounts, CHART_WIDTH, CHART_HEIGHT);
  const linePath = ChartUtils.generateSmoothPath(points);

  // Criar path para área preenchida
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`;

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.total, { color }]}>
          {ChartUtils.formatCurrency(totalAmount)}
        </Text>
      </View>

      <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chart}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>
        <Path
          d={areaPath}
          fill="url(#gradient)"
        />
        <Path
          d={linePath}
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Variação diária
          </Text>
        </View>
        <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
          Máx: {ChartUtils.formatCurrency(maxAmount)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    padding: Spacing.base,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  total: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  chart: {
    marginVertical: Spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: Typography.fontSize.sm,
  },
  legendValue: {
    fontSize: Typography.fontSize.sm,
  },
  emptyState: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
  },
});