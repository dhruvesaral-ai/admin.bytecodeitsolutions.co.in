import type { CarousalPosition } from "@/lib/carousal-position";

export type GeneralStatus = "active" | "inactive";

export type Carousal = {
  id: string;
  carousalSlideIds: string[];
  position: CarousalPosition;
};

export type CarouselSlide = {
  id: string;
  bgImgUrl: string;
  order: number;
  title: string;
  description: string | null;
  btnHrefLink: string | null;
  textContainerAlign: string | null;
  imgUrl: string | null;
  bannerHrefLink: string | null;
};

export type CourseCategorie = {
  id: string;
  name: string;
  slug: string;
};

export type CourseModule = {
  id: string;
  title: string;
  description: string | null;
};

export type Course = {
  id: string;
  name: string;
  description: string | null;
  originalPrice: string | null;
  discountedPrice: string | null;
  rating: number | null;
  technologyTags: string[];
  duration: string | null;
  status: GeneralStatus;
  courseImgUrl: string | null;
  syllabus: string | null;
  courseCategorieId: string | null;
  isPlacementGurranted: boolean;
  isInSale: boolean;
  courseModuleIds: string[];
  courseCategorie?: CourseCategorie | null;
};

export type ListResponse<T> = { data: T[] };
export type ItemResponse<T> = { data: T };
