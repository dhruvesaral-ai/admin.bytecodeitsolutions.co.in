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

export type Batch = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    registrations?: number;
    enrollments?: number;
    classes?: number;
  };
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

export type Setting = {
  id: string;
  companyLightThemedLogoUrl: string | null;
  companyDarkThemedLogoUrl: string | null;
  companyName: string | null;
  companyAddress: string | null;
  companyWhatsappNumber: string | null;
  companyPrimaryContactNumber: string | null;
  companySecondaryContactNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Role = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number };
};

export type User = {
  id: string;
  username: string;
  status: GeneralStatus;
  roleId: string | null;
  createdAt: string;
  updatedAt: string;
  role?: Role | null;
  profile?: Profile | null;
};

export type Profile = {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: GeneralStatus;
  profileImgUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  addresses?: Address[];
};

export type Address = {
  id: string;
  addressLine: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  profileId: string;
  createdAt: string;
  updatedAt: string;
  profile?: Pick<Profile, "id" | "name" | "email">;
};

export type Registration = {
  id: string;
  courseId: string;
  batchId: string | null;
  profileId: string;
  registrationNo: string;
  createdAt: string;
  updatedAt: string;
  course?: Pick<Course, "id" | "name">;
  batch?: { id: string; name: string } | null;
  profile?: Pick<Profile, "id" | "name" | "email">;
  enrollment?: { id: string; enrollmentNo: string } | null;
  payments?: Payment[];
};

export type Enrollment = {
  id: string;
  courseId: string;
  registrationId: string;
  enrollmentNo: string;
  batchId: string | null;
  profileId: string;
  createdAt: string;
  updatedAt: string;
  course?: Pick<Course, "id" | "name">;
  batch?: { id: string; name: string } | null;
  profile?: Pick<Profile, "id" | "name" | "email">;
  registration?: Pick<Registration, "id" | "registrationNo">;
  payments?: Payment[];
};

export type Payment = {
  id: string;
  enrollmentId: string | null;
  registrationId: string | null;
  paymentMethod: string;
  rupees: number | string;
  paymentProof: string | null;
  isVerified: boolean;
  profileId: string;
  createdAt: string;
  updatedAt: string;
  profile?: Pick<Profile, "id" | "name" | "email">;
  enrollment?: { id: string; enrollmentNo: string; course?: Pick<Course, "id" | "name"> } | null;
  registration?: { id: string; registrationNo: string; course?: Pick<Course, "id" | "name"> } | null;
};

export type ListResponse<T> = { data: T[] };
export type ItemResponse<T> = { data: T };

