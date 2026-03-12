import { Account } from "@/types/account";

export const DUMMY_ACCOUNT: Account = {
  id: "1",
  type: "Driver",
  username: "jona",
  display_name: "Jona",
  city: "Tampa",
  profile_pic_url: "/profile-pic.jpg",
  bio: "Tampa local and 5 ⭐ driver. Happy to share great spots, food, and things to do around the city.",
  custom_url: "/jona/companion",
  tips: {
    cashapp: "$JonaFerreira",
    venmo: "@jonaferreira",
  },
  qr_code_url: "https://roamcompanion.app/ride/1",
  passenger_experience: null,
  created_at: "2024-03-01T09:00:00.000Z",
  updated_at: "2025-03-10T14:32:00.000Z",
  is_active: true,
};

// v1 — localStorage mock. Swap for Supabase auth in v2.
// Password check happens server-side via checkDriverPassword() in lib/actions/login.ts

export const login = (username: string): Account | null => {
  if (username !== DUMMY_ACCOUNT.username) return null;
  localStorage.setItem("currentAccountId", DUMMY_ACCOUNT.id);
  localStorage.setItem(
    `account_${DUMMY_ACCOUNT.id}`,
    JSON.stringify(DUMMY_ACCOUNT)
  );
  return DUMMY_ACCOUNT;
};

export const logout = (): void => {
  localStorage.removeItem("currentAccountId");
};

export const getCurrentAccount = (): Account | null => {
  const id = localStorage.getItem("currentAccountId");
  if (!id) return null;
  const raw = localStorage.getItem(`account_${id}`);
  return raw ? (JSON.parse(raw) as Account) : DUMMY_ACCOUNT;
};

// Server-safe lookup — no localStorage. Swap for DB query in v2.
export const getAccountByUsername = (username: string): Account | null => {
  if (username === DUMMY_ACCOUNT.username) return DUMMY_ACCOUNT;
  return null;
};

export const saveAccount = (account: Account): void => {
  const updated: Account = {
    ...account,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(`account_${account.id}`, JSON.stringify(updated));
};
