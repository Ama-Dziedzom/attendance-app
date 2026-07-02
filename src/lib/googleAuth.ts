import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: false,
});

export interface GoogleIdentity {
  idToken: string;
  name: string;
  email: string;
}

/** Returns null if the user cancelled the picker; throws on any other failure. */
export async function signInWithGoogle(): Promise<GoogleIdentity | null> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) return null; // cancelled

    const { idToken, user } = response.data;
    if (!idToken) throw new Error('Google did not return an ID token.');

    return {
      idToken,
      name: user.name ?? user.givenName ?? user.email,
      email: user.email,
    };
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) return null;
    throw err;
  }
}

export async function signOutGoogle() {
  await GoogleSignin.signOut();
}
