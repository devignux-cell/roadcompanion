import { Account } from "@/types/account";

export const DUMMY_ACCOUNT: Account = {
  id: "1",
  type: "Driver",
  username: "test",
  password_hash: "test",
  display_name: "Jona",
  city: "Tampa",
  profile_pic_url: "https://i.pravatar.cc/150?img=12",
  bio: "Ybor City native. 5 ⭐ since 2021. Ask me anything about Tampa.",
  custom_url: "/test/companion",
  tips: {
    cashapp: "$CarlosTampa",
    venmo: "@CarlosTampa",
    paypal: "CarlosTampaRides",
  },
  qr_code_url: "https://roamcompanion.app/ride/1",
  passenger_experience: null,
  created_at: "2024-03-01T09:00:00.000Z",
  updated_at: "2025-03-10T14:32:00.000Z",
  is_active: true,
};

// v1 — localStorage mock. Swap for Supabase auth in v2.

export const login = (username: string, password: string): Account | null => {
  if (
    username === DUMMY_ACCOUNT.username &&
    password === DUMMY_ACCOUNT.password_hash
  ) {
    localStorage.setItem("currentAccountId", DUMMY_ACCOUNT.id);
    localStorage.setItem(
      `account_${DUMMY_ACCOUNT.id}`,
      JSON.stringify(DUMMY_ACCOUNT)
    );
    return DUMMY_ACCOUNT;
  }
  return null;
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
