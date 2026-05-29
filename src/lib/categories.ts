type CategoryDefinition = {
  value: string;
  label: string;
  seoName: string;
  slug: string;
  description: string;
  subcategories: readonly string[];
};

export const categoryConfig = [
  {
    value: "HOME_DECOR",
    label: "Home Decor",
    seoName: "3D printed home decor",
    slug: "home-decor",
    description: "Decorative 3D printed accents for shelves, walls, tables, and seasonal spaces.",
    subcategories: [
      "Wall Art",
      "Sculptures",
      "Shelf Decor",
      "Decorative Storage",
      "Seasonal Decor",
    ],
  },
  {
    value: "DESK_ACCESSORIES",
    label: "Desk Accessories",
    seoName: "3D printed desk accessories",
    slug: "desk-accessories",
    description: "Functional desk upgrades including stands, organizers, and everyday workspace tools.",
    subcategories: [
      "Pen Holders",
      "Phone Stands",
      "Headphone Stands",
      "Controller Stands",
      "Cable Organizers",
    ],
  },
  {
    value: "LAMPS",
    label: "Lamps",
    seoName: "3D printed lamps",
    slug: "lamps",
    description: "Ambient lamp builds, lightboxes, and display lighting made with custom 3D printed parts.",
    subcategories: [
      "Table Lamps",
      "Night Lamps",
      "Lightboxes",
      "Lamp Shades",
      "Display Lamps",
    ],
  },
  {
    value: "VASES_AND_PLANTERS",
    label: "Vases & Planters",
    seoName: "3D printed vases and planters",
    slug: "vases-planters",
    description: "Stylized vases, pots, and planters for flowers, herbs, and indoor display pieces.",
    subcategories: [
      "Flower Vases",
      "Plant Pots",
      "Hanging Planters",
      "Desk Planters",
      "Sculptural Planters",
    ],
  },
  {
    value: "TOYS_AND_FIDGETS",
    label: "Toys & Fidgets",
    seoName: "3D printed toys and fidgets",
    slug: "toys-fidgets",
    description: "Playful articulated prints, tactile fidgets, desk toys, and everyday carry fun pieces.",
    subcategories: [
      "Articulated Toys",
      "Fidget Toys",
      "Puzzle Toys",
      "Keychains",
      "Desk Toys",
    ],
  },
  {
    value: "COLLECTIBLES_AND_FIGURES",
    label: "Collectibles & Figures",
    seoName: "3D printed collectibles and figures",
    slug: "collectibles-figures",
    description: "Display-ready character figures, statues, busts, miniatures, and collector-focused pieces.",
    subcategories: [
      "Character Figures",
      "Miniatures",
      "Busts",
      "Statues",
      "Display Pieces",
    ],
  },
  {
    value: "GAMING_AND_POP_CULTURE",
    label: "Gaming & Pop Culture",
    seoName: "3D printed gaming and pop culture decor",
    slug: "gaming-pop-culture",
    description: "Fan-inspired decor and display items drawing from games, anime, movies, and TV fandoms.",
    subcategories: [
      "Anime",
      "Movie and TV",
      "Game-Inspired Pieces",
      "Franchise Decor",
      "Fan Art Displays",
    ],
  },
  {
    value: "COSPLAY_PROPS_AND_MODEL_KITS",
    label: "Cosplay, Props & Model Kits",
    seoName: "3D printed cosplay props and model kits",
    slug: "cosplay-props-model-kits",
    description: "Wearable props, masks, weapon builds, and kit-based prints for makers and cosplayers.",
    subcategories: [
      "Wearable Props",
      "Weapon Props",
      "Masks",
      "Model Kits",
      "Assembly Kits",
    ],
  },
  {
    value: "CUSTOM_AND_PERSONALIZED",
    label: "Custom & Personalized",
    seoName: "custom 3D printed products",
    slug: "custom-personalized",
    description: "Commissioned prints, branded pieces, personalized gifts, and one-off builds made to request.",
    subcategories: [
      "Nameplates",
      "Custom Gifts",
      "Business Branding",
      "Memorial Pieces",
      "One-off Commissions",
    ],
  },
  {
    value: "PET_ACCESSORIES",
    label: "Pet Accessories",
    seoName: "3D printed pet accessories",
    slug: "pet-accessories",
    description: "Pet tags, holders, decor, and keepsakes designed for everyday pet-friendly use.",
    subcategories: [
      "Pet Tags",
      "Bowl Stands",
      "Toy Holders",
      "Small Pet Decor",
      "Custom Pet Keepsakes",
    ],
  },
] as const satisfies readonly CategoryDefinition[];

export type Category = (typeof categoryConfig)[number]["value"];
export type CategoryDetails = (typeof categoryConfig)[number];

export const categoryValues = categoryConfig.map(
  (category) => category.value
) as [Category, ...Category[]];

export const defaultCategory = categoryValues[0];

export const categoryByValue = Object.fromEntries(
  categoryConfig.map((category) => [category.value, category])
) as Record<Category, CategoryDetails>;

export const categoryLabels = Object.fromEntries(
  categoryConfig.map((category) => [category.value, category.label])
) as Record<Category, string>;

export const categorySeoNames = Object.fromEntries(
  categoryConfig.map((category) => [category.value, category.seoName])
) as Record<Category, string>;

export const categorySlugs = Object.fromEntries(
  categoryConfig.map((category) => [category.value, category.slug])
) as Record<Category, string>;

export const categoryDescriptions = Object.fromEntries(
  categoryConfig.map((category) => [category.value, category.description])
) as Record<Category, string>;

export const categorySubcategories = Object.fromEntries(
  categoryConfig.map((category) => [category.value, [...category.subcategories]])
) as Record<Category, string[]>;

const categoryValueSet = new Set<string>(categoryValues);

export function isCategoryValue(value: string): value is Category {
  return categoryValueSet.has(value);
}

export function isValidSubcategoryForCategory(
  category: Category,
  subcategory: string
) {
  return categorySubcategories[category].includes(subcategory.trim());
}