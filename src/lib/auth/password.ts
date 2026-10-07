import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(password: string, rounds = ROUNDS) {
  return bcrypt.hash(password, rounds);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
