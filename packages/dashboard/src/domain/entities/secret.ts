export interface Secret {
  id: string;
  key: string;
  value: string;
  isSensitive: boolean;
  isLocked?: boolean;
}

export interface SecretDraft extends Pick<Secret, 'key' | 'value' | 'isSensitive'> {
  isNew?: boolean;
  originalKey?: string;
}

export const validateSecretKey = (key: string): string | null => {
  if (!key) return "Key is required";
  if (key.includes(" ")) return "Key cannot contain spaces";
  if (/[^a-zA-Z0-9_-]/.test(key)) return "Key must be alphanumeric (underscores/hyphens allowed)";
  return null;
};
