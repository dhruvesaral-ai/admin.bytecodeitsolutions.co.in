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

export type Testimonial = {
  id: string;
  name: string;
  profileImg: string | null;
  companyName: string | null;
};

export type SuccessStory = {
  id: string;
  videoIds: string[];
};

export type Course = {
  id: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
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

export type LeadStatus = "hot" | "medium" | "cold" | "converted";
export type LeadGeneratedSource = "online" | "offline";

export type LeadRemark = {
  id: string;
  leadId: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
};

export type Lead = {
  id: string;
  firstName: string;
  lastName: string | null;
  username: string;
  utmSource: string | null;
  courseId: string | null;
  hasBeenCalled: boolean;
  nextCallDate: string | null;
  status: LeadStatus;
  generatedSource: LeadGeneratedSource;
  leadRemark: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  course: Pick<Course, "id" | "name"> | null;
  remarks: LeadRemark[];
  remarksIds: string[];
};

export type Page = {
  id: string;
  heading: string;
  subheading: string;
  routeName: string;
};

export type ListResponse<T> = { data: T[] };
export type ItemResponse<T> = { data: T };
