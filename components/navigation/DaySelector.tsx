import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '@/theme';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_WIDTH = SCREEN_WIDTH / 7;

interface DaySelectorProps {
  onDayChange?: (date: Date) => void;
}

export function DaySelector({ onDayChange }: DaySelectorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Gerar array de 7 dias (3 anteriores, atual, 3 posteriores)
  const generateDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const days = generateDays();

  const getDayName = (date: Date) => {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return dayNames[date.getDay()];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
    onDayChange?.(date);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={DAY_WIDTH}
        decelerationRate="fast">
        {days.map((date, index) => {
          const selected = isSelected(date);
          const today = isToday(date);

          return (
            <TouchableOpacity
              key={index}
              style={styles.dayContainer}
              onPress={() => handleDayPress(date)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.dayCircle,
                  selected && {
                    backgroundColor: colors.primary,
                  },
                  !selected && today && {
                    borderWidth: 2,
                    borderColor: colors.primary,
                  },
                ]}>
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: selected
                        ? colorScheme === 'light'
                          ? colors.background
                          : colors.background
                        : colors.text,
                    },
                  ]}>
                  {date.getDate()}
                </Text>
              </View>
              <Text
                style={[
                  styles.dayName,
                  {
                    color: selected ? colors.primary : colors.textSecondary,
                  },
                ]}>
                {getDayName(date)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scrollContent: {
    paddingHorizontal: Spacing.sm,
  },
  dayContainer: {
    width: DAY_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  dayNumber: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
  },
  dayName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});