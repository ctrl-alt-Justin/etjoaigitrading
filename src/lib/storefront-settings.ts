import fs from "fs/promises";
import path from "path";
import { 
  type StorefrontSettings, 
  type CatalogBannerSettings, 
  DEFAULT_STOREFRONT_SETTINGS 
} from "./storefront-settings-types";

export * from "./storefront-settings-types";

const SETTINGS_FILE_PATH = path.join(process.cwd(), "data", "storefront-settings.json");

let memoryCache: StorefrontSettings | null = null;

export function invalidateStorefrontCache() {
  memoryCache = null;
}

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  if (memoryCache) {
    return memoryCache;
  }
  try {
    const data = await fs.readFile(SETTINGS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(data);
    const settings: StorefrontSettings = {
      spotlightItemIds: Array.isArray(parsed.spotlightItemIds) ? parsed.spotlightItemIds : [],
      catalogBanner: {
        ...DEFAULT_STOREFRONT_SETTINGS.catalogBanner,
        ...(parsed.catalogBanner || {}),
      },
    };
    memoryCache = settings;
    return settings;
  } catch {
    return DEFAULT_STOREFRONT_SETTINGS;
  }
}

export async function saveStorefrontSettings(
  updates: Partial<StorefrontSettings>
): Promise<StorefrontSettings> {
  const current = await getStorefrontSettings();
  const next: StorefrontSettings = {
    spotlightItemIds: Array.isArray(updates.spotlightItemIds)
      ? updates.spotlightItemIds
      : current.spotlightItemIds,
    catalogBanner: {
      ...current.catalogBanner,
      ...(updates.catalogBanner || {}),
    },
  };

  memoryCache = next;

  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(next, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save storefront settings:", err);
  }

  return next;
}

