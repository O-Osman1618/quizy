/** Responsive answer grid classes for 2 / 3 / 4 choices. */
export function answerGridClass(count: number): string {
  if (count <= 2) {
    return "grid-cols-1 short:grid-cols-2 sm:grid-cols-2";
  }
  if (count === 3) {
    return "grid-cols-3";
  }
  return "grid-cols-2 short:grid-cols-4";
}
