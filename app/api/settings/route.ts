import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaForeignKeyViolation,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseSettingCreateBody,
  settingDetailInclude,
  type SettingWriteBody,
} from "@/lib/setting";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { createdAt: "asc" },
      include: settingDetailInclude,
    });
    return jsonOk({ data: settings });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<SettingWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseSettingCreateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const setting = await prisma.setting.create({
      data: parsed.data,
      include: settingDetailInclude,
    });
    return jsonOk({ data: setting }, 201);
  } catch (error) {
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("companyAddressId does not match an existing address", 400);
    }
    return jsonError(error, 500);
  }
}
