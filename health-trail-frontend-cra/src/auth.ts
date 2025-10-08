export const TOKEN_KEY = "ht_token";
export const USERNAME_KEY = "ht_user";
export function saveAuth(token: string, username: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}
export function loadToken() { return localStorage.getItem(TOKEN_KEY); }
export function clearAuth() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USERNAME_KEY); }
