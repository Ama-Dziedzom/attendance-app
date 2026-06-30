import * as Network from 'expo-network';

export type NetworkStatus = 'allowed' | 'no_wifi' | 'wrong_network';

/**
 * Checks whether the device is on an allowed company network.
 *
 * @param allowedSubnets - IP prefixes from agencies.network_config.allowed_subnets
 *   e.g. ["192.168.", "10.0.0."]
 *   If empty, any WiFi connection is accepted (not yet configured).
 */
export async function checkCompanyNetwork(
  allowedSubnets: string[],
): Promise<NetworkStatus> {
  const state = await Network.getNetworkStateAsync();

  if (!state.isConnected || state.type !== Network.NetworkStateType.WIFI) {
    return 'no_wifi';
  }

  // No subnets configured for this agency yet — allow any WiFi
  if (allowedSubnets.length === 0) return 'allowed';

  const ip = await Network.getIpAddressAsync();
  const onAllowedNetwork = allowedSubnets.some((subnet) => ip.startsWith(subnet));

  return onAllowedNetwork ? 'allowed' : 'wrong_network';
}
