export interface CatalogBannerSettings {
  productName: string;
  productDesc: string;
  productPrice: string;
  promoTitle: string;
  promoSubtitle: string;
  bgPhotoUrl?: string;
}

export interface StorefrontSettings {
  spotlightItemIds: number[];
  catalogBanner: CatalogBannerSettings;
}

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettings = {
  spotlightItemIds: [],
  catalogBanner: {
    productName: "LANDSKRONA",
    productDesc: "2-seat sofa, dark blue velvet.",
    productPrice: "4799",
    promoTitle: "SUPER SUMMER SALE",
    promoSubtitle: "UP TO 50% OFF ON SELECTED PRE-OWNED ITEMS",
    bgPhotoUrl: "",
  },
};
