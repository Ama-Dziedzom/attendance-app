import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon, Wifi01Icon, Alert01Icon, Camera01Icon, Refresh01Icon } from '@hugeicons/core-free-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { clockInEmployee, fetchAgencyAllowedSubnets } from '../services/attendanceService';
import { checkCompanyNetwork, NetworkStatus } from '../utils/networkCheck';
import { NETWORK } from '../config/network';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type ScanState = 'checking' | 'no_permission' | NetworkStatus;

const ERROR_COPY: Record<string, { icon: any; title: string; body: string }> = {
  no_wifi: {
    icon: Wifi01Icon,
    title: 'No WiFi connection',
    body: `Connect to the ${NETWORK.companyName} office WiFi to clock in. Mobile data is not supported.`,
  },
  wrong_network: {
    icon: Alert01Icon,
    title: 'Wrong network',
    body: `You're on WiFi but not the ${NETWORK.companyName} network (192.168.x.x). Move to the office and try again.`,
  },
  no_permission: {
    icon: Camera01Icon,
    title: 'Camera access needed',
    body: 'Allow camera access in Settings so the app can scan the entrance QR code.',
  },
};

export default function ScannerScreen() {
  const nav = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { user, clockIn } = useApp();
  const [scanState, setScanState] = useState<ScanState>('checking');
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const reticleOpacity = useRef(new Animated.Value(0.55)).current;

  // Step 1: fetch agency subnets → Step 2: network check → Step 3: camera permission
  useEffect(() => {
    (async () => {
      const subnets = user?.agencyId
        ? await fetchAgencyAllowedSubnets(user.agencyId).catch(() => [])
        : [];
      const network = await checkCompanyNetwork(subnets);
      if (network !== 'allowed') { setScanState(network); return; }
      const granted = permission?.granted ?? (await requestPermission()).granted;
      setScanState(granted ? 'allowed' : 'no_permission');
    })();
  }, []);

  // Reticle pulse while scanning
  useEffect(() => {
    if (scanState !== 'allowed') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(reticleOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(reticleOpacity, { toValue: 0.55, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanState]);

  const handleQRScanned = async ({ data: _qrData }: { data: string }) => {
    if (scanned || !user) return;
    setScanned(true);
    try {
      const record = await clockInEmployee(user.id);
      const time = new Date(record.clock_in_time).toLocaleTimeString([], {
        hour: 'numeric', minute: '2-digit',
      });
      clockIn(time);
      nav.replace('Success', { clockInTime: time });
    } catch (err: any) {
      setScanned(false);
      Alert.alert('Clock-in failed', err?.message ?? 'Could not record your attendance. Try again.');
    }
  };

  const retry = async () => {
    setScanned(false);
    setScanState('checking');
    const subnets = user?.agencyId
      ? await fetchAgencyAllowedSubnets(user.agencyId).catch(() => [])
      : [];
    const network = await checkCompanyNetwork(subnets);
    if (network !== 'allowed') { setScanState(network); return; }
    const granted = permission?.granted ?? (await requestPermission()).granted;
    setScanState(granted ? 'allowed' : 'no_permission');
  };

  const error = scanState !== 'checking' && scanState !== 'allowed' ? ERROR_COPY[scanState] : null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {scanState === 'allowed' && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleQRScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
      )}
      {scanState === 'allowed' && <View style={styles.overlay} />}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn} activeOpacity={0.8}>
          <HugeiconsIcon icon={Cancel01Icon} size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan to clock in</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Checking */}
      {scanState === 'checking' && (
        <View style={styles.body}>
          <View style={styles.stateCard}>
            <View style={[styles.stateIcon, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
              <HugeiconsIcon icon={Wifi01Icon} size={28} color="#6366F1" />
            </View>
            <Text style={styles.stateTitle}>Checking connection…</Text>
            <Text style={styles.stateBody}>
              Verifying you're on the {NETWORK.companyName} network
            </Text>
          </View>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.body}>
          <View style={[styles.stateCard, styles.errorCard]}>
            <View style={[styles.stateIcon, { backgroundColor: 'rgba(248,113,113,0.12)' }]}>
              <HugeiconsIcon icon={error.icon} size={30} color="#F87171" />
            </View>
            <Text style={styles.stateTitle}>{error.title}</Text>
            <Text style={styles.stateBody}>{error.body}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={retry} activeOpacity={0.8}>
              <HugeiconsIcon icon={Refresh01Icon} size={16} color="#fff" />
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Scanner UI */}
      {scanState === 'allowed' && (
        <View style={styles.body}>
          <View style={styles.finder}>
            <Animated.View style={[styles.corner, styles.cornerTL, { opacity: reticleOpacity }]} />
            <Animated.View style={[styles.corner, styles.cornerTR, { opacity: reticleOpacity }]} />
            <Animated.View style={[styles.corner, styles.cornerBL, { opacity: reticleOpacity }]} />
            <Animated.View style={[styles.corner, styles.cornerBR, { opacity: reticleOpacity }]} />
          </View>
          <View style={styles.instructions}>
            <Text style={styles.instructTitle}>Hold steady…</Text>
            <Text style={styles.instructBody}>
              Point at the workplace QR code at your entrance
            </Text>
          </View>
        </View>
      )}

      {scanState === 'allowed' && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.cameraTag}>
            <HugeiconsIcon icon={Camera01Icon} size={15} color="rgba(255,255,255,0.5)" />
            <Text style={styles.cameraText}>CAMERA FEED · scanning</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E17' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,14,23,0.55)' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 16, zIndex: 10,
  },
  closeBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, zIndex: 10 },
  stateCard: {
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24, padding: 32, width: '100%',
  },
  errorCard: { borderColor: 'rgba(248,113,113,0.2)' },
  stateIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  stateTitle: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff', marginBottom: 8 },
  stateBody: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12,
  },
  retryText: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
  finder: { width: 248, height: 248, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 46, height: 46, borderColor: '#6366F1', borderWidth: 0 },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  instructions: { marginTop: 34, alignItems: 'center', paddingHorizontal: 30 },
  instructTitle: { fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff', marginBottom: 6 },
  instructBody: { fontSize: 14, color: 'rgba(255,255,255,0.55)', fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center' },
  footer: { alignItems: 'center', paddingHorizontal: 24, zIndex: 10 },
  cameraTag: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 11, paddingHorizontal: 18, borderRadius: 14,
  },
  cameraText: { fontSize: 12, fontFamily: 'JetBrainsMono_400Regular', color: 'rgba(255,255,255,0.5)' },
});
