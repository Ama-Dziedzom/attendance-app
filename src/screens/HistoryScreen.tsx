import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

const RECORDS = [
  { mon: 'JUN', day: '24', weekday: 'Tuesday',   clockIn: '09:02', clockOut: '17:34', hours: '8.5h', status: 'On time', statusColor: '#1F8A5B', dotBg: '#EEF0FF', dotInk: '#4338CA' },
  { mon: 'JUN', day: '23', weekday: 'Monday',    clockIn: '09:11', clockOut: '17:40', hours: '8.5h', status: 'Late',    statusColor: '#C77A1E', dotBg: '#FFF3E2', dotInk: '#C77A1E' },
  { mon: 'JUN', day: '20', weekday: 'Friday',    clockIn: '08:54', clockOut: '16:30', hours: '7.6h', status: 'On time', statusColor: '#1F8A5B', dotBg: '#EEF0FF', dotInk: '#4338CA' },
  { mon: 'JUN', day: '19', weekday: 'Thursday',  clockIn: '09:00', clockOut: '17:28', hours: '8.5h', status: 'On time', statusColor: '#1F8A5B', dotBg: '#EEF0FF', dotInk: '#4338CA' },
  { mon: 'JUN', day: '18', weekday: 'Wednesday', clockIn: '08:58', clockOut: '17:20', hours: '8.4h', status: 'On time', statusColor: '#1F8A5B', dotBg: '#EEF0FF', dotInk: '#4338CA' },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.month}>June 2026</Text>

        <View style={styles.statsRow}>
          <View style={styles.statPrimary}>
            <Text style={styles.statPrimaryNum}>142.5</Text>
            <Text style={styles.statPrimaryLabel}>hours this month</Text>
          </View>
          <View style={styles.statSecondary}>
            <Text style={styles.statSecondaryNum}>18</Text>
            <Text style={styles.statSecondaryLabel}>days present</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>THIS WEEK</Text>
        <View style={styles.listCard}>
          {RECORDS.map((item, idx) => (
            <View key={idx} style={[styles.row, idx === 0 && { borderTopWidth: 0 }]}>
              <View style={[styles.badge, { backgroundColor: item.dotBg }]}>
                <Text style={[styles.badgeMon, { color: item.dotInk }]}>{item.mon}</Text>
                <Text style={styles.badgeDay}>{item.day}</Text>
              </View>
              <View style={styles.mid}>
                <Text style={styles.weekday}>{item.weekday}</Text>
                <Text style={styles.times}>{item.clockIn} – {item.clockOut}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.hours}>{item.hours}</Text>
                <Text style={[styles.status, { color: item.statusColor }]}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 22 },
  title: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: COLORS.dark, letterSpacing: -0.5 },
  month: { fontSize: 14, color: COLORS.muted, fontFamily: 'PlusJakartaSans_400Regular', marginBottom: 22 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statPrimary: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 18, padding: 16 },
  statPrimaryNum: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#fff', letterSpacing: -0.5 },
  statPrimaryLabel: { fontSize: 12.5, color: 'rgba(255,255,255,0.75)', fontFamily: 'PlusJakartaSans_500Medium' },
  statSecondary: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  statSecondaryNum: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: COLORS.dark, letterSpacing: -0.5 },
  statSecondaryLabel: { fontSize: 12.5, color: COLORS.subtle, fontFamily: 'PlusJakartaSans_500Medium' },
  sectionLabel: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: COLORS.subtle, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 },
  listCard: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  badge: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgeMon: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeDay: { fontSize: 17, fontFamily: 'PlusJakartaSans_800ExtraBold', color: COLORS.dark, lineHeight: 19 },
  mid: { flex: 1 },
  weekday: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: COLORS.dark },
  times: { fontSize: 13, color: COLORS.subtle, fontFamily: 'JetBrainsMono_400Regular' },
  right: { alignItems: 'flex-end' },
  hours: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: COLORS.dark },
  status: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold' },
});
