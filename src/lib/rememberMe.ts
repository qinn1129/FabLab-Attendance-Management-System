interface RememberedAccount {
  id: string;
  role: "Admin" | "ResidentMaker";
}

const keyFor = (role: "Admin" | "ResidentMaker") =>
  role === "Admin" ? "fablab_remember_admin" : "fablab_remember_rm";

export const rememberMe = {
  save(role: "Admin" | "ResidentMaker", id: string) {
    localStorage.setItem(keyFor(role), JSON.stringify({ id, role }));
  },

  clear(role: "Admin" | "ResidentMaker") {
    localStorage.removeItem(keyFor(role));
  },

  get(role: "Admin" | "ResidentMaker"): RememberedAccount | null {
    const raw = localStorage.getItem(keyFor(role));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RememberedAccount;
    } catch {
      return null;
    }
  }
};