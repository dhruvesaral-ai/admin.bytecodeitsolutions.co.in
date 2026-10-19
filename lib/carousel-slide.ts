import type { Prisma } from "@/generated/prisma/client";

export type CarouselSlideWriteBody = {
  bgImgUrl?: string;
  order?: number;
  title?: string;
  description?: string | null;
  btnHrefLink?: string | null;
  textContainerAlign?: string | null;
  imgUrl?: string | null;
  bannerHrefLink?: string | null;
};

function parseNonEmptyString(
  value: unknown,
  field: string,
): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${field} must be a non-empty string` };
  }
  return { value: value.trim() };
}

function parseNullableString(
  value: unknown,
  field: string,
): { value: string | null } | { error: string } {
  if (value === null) {
    return { value: null };
  }
  if (typeof value !== "string") {
    return { error: `${field} must be a string or null` };
  }
  const trimmed = value.trim();
  return { value: trimmed === "" ? null : trimmed };
}

function assignSlideFields(
  body: CarouselSlideWriteBody,
  data: Prisma.CarouselSlideCreateInput | Prisma.CarouselSlideUpdateInput,
  mode: "create" | "update",
): { error: string } | null {
  if (body.bgImgUrl !== undefined) {
    const bgImgUrl = parseNonEmptyString(body.bgImgUrl, "bgImgUrl");
    if ("error" in bgImgUrl) {
      return bgImgUrl;
    }
    data.bgImgUrl = bgImgUrl.value;
  } else if (mode === "create") {
    return { error: "bgImgUrl is required" };
  }

  if (body.order !== undefined) {
    if (typeof body.order !== "number" || !Number.isInteger(body.order)) {
      return { error: "order must be an integer" };
    }
    data.order = body.order;
  } else if (mode === "create") {
    return { error: "order is required" };
  }

  if (body.title !== undefined) {
    const title = parseNonEmptyString(body.title, "title");
    if ("error" in title) {
      return title;
    }
    data.title = title.value;
  } else if (mode === "create") {
    return { error: "title is required" };
  }

  if (body.description !== undefined) {
    const description = parseNullableString(body.description, "description");
    if ("error" in description) {
      return description;
    }
    data.description = description.value;
  }

  if (body.btnHrefLink !== undefined) {
    const btnHrefLink = parseNullableString(body.btnHrefLink, "btnHrefLink");
    if ("error" in btnHrefLink) {
      return btnHrefLink;
    }
    data.btnHrefLink = btnHrefLink.value;
  }

  if (body.textContainerAlign !== undefined) {
    const textContainerAlign = parseNullableString(
      body.textContainerAlign,
      "textContainerAlign",
    );
    if ("error" in textContainerAlign) {
      return textContainerAlign;
    }
    data.textContainerAlign = textContainerAlign.value;
  }

  if (body.imgUrl !== undefined) {
    const imgUrl = parseNullableString(body.imgUrl, "imgUrl");
    if ("error" in imgUrl) {
      return imgUrl;
    }
    data.imgUrl = imgUrl.value;
  }

  if (body.bannerHrefLink !== undefined) {
    const bannerHrefLink = parseNullableString(
      body.bannerHrefLink,
      "bannerHrefLink",
    );
    if ("error" in bannerHrefLink) {
      return bannerHrefLink;
    }
    data.bannerHrefLink = bannerHrefLink.value;
  }

  return null;
}

export function parseCarouselSlideCreateBody(
  body: CarouselSlideWriteBody,
): { data: Prisma.CarouselSlideCreateInput } | { error: string } {
  const data = {} as Prisma.CarouselSlideCreateInput;
  const error = assignSlideFields(body, data, "create");
  if (error) {
    return error;
  }
  return { data };
}

export function parseCarouselSlideUpdateBody(
  body: CarouselSlideWriteBody,
): { data: Prisma.CarouselSlideUpdateInput } | { error: string } {
  const data: Prisma.CarouselSlideUpdateInput = {};
  const error = assignSlideFields(body, data, "update");
  if (error) {
    return error;
  }
  if (Object.keys(data).length === 0) {
    return { error: "At least one field is required to update" };
  }
  return { data };
}
