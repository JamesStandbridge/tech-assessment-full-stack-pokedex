/** Fail on a value the type system proved impossible, so a new union member breaks the build. */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
