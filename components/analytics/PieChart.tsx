// components/analytics/PieChart.tsx

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Spacing, Typography } from '@/theme';
import { CategoryOverview } from '@/types/analytics';
import { ChartUtils } from '@/utils/chart';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface PieChartProps {
  data: CategoryOverview[];
  title: string;
}

const CHART_SIZE = 160;
const CHART_RADIUS = CHART_SIZE / 2;
const STROKE_WIDTH = 40;

export function PieChart({ data, title }: PieChartProps) {
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

  const totalAmount = data.reduce((sum, item) => sum + item.total_amount, 0);

  // Calcular arcos do gráfico de pizza
  const circumference = 2 * Math.PI * (CHART_RADIUS - STROKE_WIDTH / 2);
  let currentRotation = -90; // Começar do topo

  const arcs = data.map((item) => {
    const percentage = (item.total_amount / totalAmount) * 100;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const rotation = currentRotation;
    currentRotation += (percentage / 100) * 360;

    return {
      ...item,
      strokeDasharray,
      rotation,
      percentage,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      <View style={styles.chartContainer}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          <G rotation={0} origin={`${CHART_RADIUS}, ${CHART_RADIUS}`}>
            {arcs.map((arc, index) => (
              <Circle
                key={index}
                cx={CHART_RADIUS}
                cy={CHART_RADIUS}
                r={CHART_RADIUS - STROKE_WIDTH / 2}
                stroke={arc.category_color}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={arc.strokeDasharray}
                strokeDashoffset={0}
                rotation={arc.rotation}
                origin={`${CHART_RADIUS}, ${CHART_RADIUS}`}
                strokeLinecap="butt"
              />
            ))}
          </G>
        </Svg>

        <View style={styles.centerLabel}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
            Total
          </Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>
            {ChartUtils.formatCurrency(totalAmount)}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendContainer}>
        <View style={styles.legend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={styles.legendItemHeader}>
                <View style={[styles.legendColorDot, { backgroundColor: item.category_color }]} />
                <IconSymbol name={item.category_icon as any} size={16} color={item.category_color} />
                <Text style={[styles.legendItemName, { color: colors.text }]} numberOfLines={1}>
                  {item.category_name}
                </Text>
              </View>
              <Text style={[styles.legendItemAmount, { color: colors.text }]}>
                {ChartUtils.formatCurrency(item.total_amount)}
              </Text>
              <Text style={[styles.legendItemPercentage, { color: colors.textSecondary }]}>
                {item.percentage.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.base,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.base,
    position: 'relative',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  legendContainer: {
    marginTop: Spacing.base,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  legendItem: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.base,
    minWidth: 120,
  },
  legendItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  legendColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendItemName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  legendItemAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    marginTop: 4,
  },
  legendItemPercentage: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
  },
});