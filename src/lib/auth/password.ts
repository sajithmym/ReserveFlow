import { hash, verify, type Options } from "@node-rs/argon2";
const options: Options = {
  algorithm: 2,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32,
};
export const hashPassword = (password: string) => hash(password, options);
export const verifyPassword = ({ password, hash: encoded }: { password: string; hash: string }) =>
  verify(encoded, password, options);
