/** Photos of the villa, used with the owner's permission. Sizes are the files' own, so the page doesn't jump while they load. */

export type Photo = { src: string; alt: string; width: number; height: number };

export const HERO_PHOTO: Photo = {
  src: "/villa/hot-tub.webp",
  alt: "Hot tub in the villa's garden, with palm trees, the pool and the sea behind",
  width: 918,
  height: 616,
};

export const GALLERY: Photo[] = [
  { src: "/villa/pool.webp", alt: "The pool in front of the white villa, with sun loungers along the far side", width: 877, height: 584 },
  { src: "/villa/dining.webp", alt: "Covered summer kitchen with a table for eight and a wood-fired grill", width: 957, height: 585 },
  { src: "/villa/bedroom.webp", alt: "Double bedroom with air conditioning, an armchair and its own bathroom", width: 1009, height: 583 },
  { src: "/villa/kitchen.webp", alt: "Kitchen with an oven, hob, coffee machine and a breakfast bar", width: 796, height: 585 },
];
