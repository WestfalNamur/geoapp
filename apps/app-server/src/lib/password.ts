export function hash(plain: string): Promise<string> {
  return Bun.password.hash(plain);
}

export async function verify(plain: string, stored: string): Promise<boolean> {
  try {
    return await Bun.password.verify(plain, stored);
  } catch {
    return false;
  }
}
