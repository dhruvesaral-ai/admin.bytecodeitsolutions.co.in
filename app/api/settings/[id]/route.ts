import { prisma } from "@/lib/db";
import {
  isNextResponse,
  isPrismaForeignKeyViolation,
  isPrismaNotFound,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api/http";
import {
  parseSettingUpdateBody,
  settingDetailInclude,
  type SettingWriteBody,
} from "@/lib/setting";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const setting = await prisma.setting.findUnique({
      where: { id },
      include: settingDetailInclude,
    });
    if (!setting) {
      return jsonError("Setting not found", 404);
    }
    return jsonOk({ data: setting });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const body = await parseJsonBody<SettingWriteBody>(request);
  if (isNextResponse(body)) {
    return body;
  }

  const parsed = parseSettingUpdateBody(body);
  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const setting = await prisma.setting.update({
      where: { id },
      data: parsed.data,
      include: settingDetailInclude,
    });
    return jsonOk({ data: setting });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Setting not found", 404);
    }
    if (isPrismaForeignKeyViolation(error)) {
      return jsonError("companyAddressId does not match an existing address", 400);
    }
    return jsonError(error, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.setting.delete({ where: { id } });
    return jsonOk({ data: { id } });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return jsonError("Setting not found", 404);
    }
    return jsonError(error, 500);
  }
}
