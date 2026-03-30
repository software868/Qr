/** True if `value` is a 24-char hex string (MongoDB ObjectId), not a business UID. */
export function isMongoObjectIdString(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
