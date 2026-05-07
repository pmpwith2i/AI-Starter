import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "oncologo_access_token";
const REFRESH_TOKEN_KEY = "oncologo_refresh_token";

let cachedAccessToken: string | null = null;

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export async function loadStoredTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  cachedAccessToken = accessToken;
  return { accessToken, refreshToken };
}

export async function storeTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  cachedAccessToken = accessToken;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearStoredTokens(): Promise<void> {
  cachedAccessToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
