import type { Prisma } from "@prisma/client";
import prisma from "./prisma";

export type JwtEventUser = {
  userId?: string;
  memberId?: string;
  memberBranchId?: string | null;
  roles?: string[];
  managedProvinceId?: string | null;
  managedBranchId?: string | null;
  managedDojoId?: string | null;
};

const SUPER_ROLES = ["ADMINISTRATOR", "ADMIN_PUSAT"] as const;

const EVENT_REGISTRAR_ROLES = [
  "ADMINISTRATOR",
  "ADMIN_PUSAT",
  "ADMIN_PROVINCE",
  "ADMIN_BRANCH",
  "ADMIN_DOJO",
] as const;

export function userCanBulkRegisterMembersForEvents(jwtUser: JwtEventUser | null | undefined): boolean {
  const roles = jwtUser?.roles || [];
  return EVENT_REGISTRAR_ROLES.some((r) => roles.includes(r));
}

/** Hak mendaftarkan anggota ke event atas nama mereka (wilayah sesuai jabatan). */
export function staffCanRegisterMemberForEvent(
  jwtUser: JwtEventUser | null | undefined,
  member: {
    isDeleted: boolean;
    dojoId: string;
    dojo: {
      branchId: string;
      branch?: { provinceId: string } | null;
    } | null;
  },
  eventBranchId: string | null,
): boolean {
  if (!jwtUser || !userCanBulkRegisterMembersForEvents(jwtUser)) return false;
  if (member.isDeleted || !member.dojo) return false;
  const roles = jwtUser.roles || [];
  const isSuper = roles.some((r) => SUPER_ROLES.includes(r as (typeof SUPER_ROLES)[number]));

  if (eventBranchId) {
    if (member.dojo.branchId !== eventBranchId) return false;
  }

  if (isSuper) return true;

  if (roles.includes("ADMIN_DOJO") && jwtUser.managedDojoId) {
    return member.dojoId === jwtUser.managedDojoId;
  }

  if (roles.includes("ADMIN_BRANCH") && jwtUser.managedBranchId) {
    return member.dojo.branchId === jwtUser.managedBranchId;
  }

  if (roles.includes("ADMIN_PROVINCE") && jwtUser.managedProvinceId) {
    return member.dojo.branch?.provinceId === jwtUser.managedProvinceId;
  }

  return false;
}

/**
 * Ketua ranting (ADMIN_DOJO tanpa jenjang provinsi/cabang di akun JWT) membaca roster event
 * hanya untuk anggota dari dojo yang dikelolanya — termasuk yang mendaftar mandiri.
 */
export function shouldRestrictEventRegistrationsToManagedDojo(
  jwtUser: JwtEventUser | null | undefined,
): jwtUser is JwtEventUser & { managedDojoId: string } {
  if (!jwtUser?.managedDojoId || !jwtUser.roles?.length) return false;
  const roles = jwtUser.roles;
  if (roles.some((r) => SUPER_ROLES.includes(r as (typeof SUPER_ROLES)[number]))) return false;
  if (roles.includes("ADMIN_BRANCH") || roles.includes("ADMIN_PROVINCE")) return false;
  return roles.includes("ADMIN_DOJO");
}

export async function resolveMemberBranchId(
  jwtUser: JwtEventUser | null | undefined,
): Promise<string | null | undefined> {
  if (!jwtUser?.memberId) return undefined;
  if (jwtUser.memberBranchId !== undefined && jwtUser.memberBranchId !== null && jwtUser.memberBranchId !== "") {
    return jwtUser.memberBranchId;
  }
  const m = await prisma.member.findUnique({
    where: { id: jwtUser.memberId },
    select: { dojo: { select: { branchId: true } } },
  });
  return m?.dojo?.branchId ?? null;
}

export async function resolveDojoBranchId(managedDojoId: string | null | undefined): Promise<string | null> {
  if (!managedDojoId) return null;
  const d = await prisma.dojo.findUnique({
    where: { id: managedDojoId },
    select: { branchId: true },
  });
  return d?.branchId ?? null;
}

/** Filter for GET /events and GET /events/:id */
export async function buildEventVisibilityWhere(
  jwtUser: JwtEventUser | null | undefined,
): Promise<Prisma.EventWhereInput> {
  if (!jwtUser || !jwtUser.roles || jwtUser.roles.length === 0) {
    return { OR: [{ branchId: null }] };
  }

  const roles = jwtUser.roles;
  if (roles.some((r) => SUPER_ROLES.includes(r as (typeof SUPER_ROLES)[number]))) {
    return {};
  }

  const { managedProvinceId, managedBranchId, managedDojoId } = jwtUser;

  if (roles.includes("ADMIN_PROVINCE") && managedProvinceId) {
    return {
      OR: [{ branchId: null }, { branch: { provinceId: managedProvinceId } }],
    };
  }

  if (roles.includes("ADMIN_BRANCH") && managedBranchId) {
    return {
      OR: [{ branchId: null }, { branchId: managedBranchId }],
    };
  }

  if (roles.includes("ADMIN_DOJO") && managedDojoId) {
    const dojoBranch = await resolveDojoBranchId(managedDojoId);
    if (!dojoBranch) {
      return { OR: [{ branchId: null }] };
    }
    return {
      OR: [{ branchId: null }, { branchId: dojoBranch }],
    };
  }

  const mb = await resolveMemberBranchId(jwtUser);
  if (mb) {
    return {
      OR: [{ branchId: null }, { branchId: mb }],
    };
  }

  return { OR: [{ branchId: null }] };
}

export async function provinceOwnsBranch(
  provinceId: string | null | undefined,
  branchId: string | null | undefined,
): Promise<boolean> {
  if (!provinceId || !branchId) return false;
  const br = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { provinceId: true },
  });
  return br?.provinceId === provinceId;
}

/** Deterministic branch assignment on POST /events */
export async function resolveBranchIdForCreate(
  jwtUser: JwtEventUser,
  bodyBranchId: string | null | undefined,
): Promise<string | null> {
  const roles = jwtUser.roles || [];

  if (roles.some((r) => SUPER_ROLES.includes(r as (typeof SUPER_ROLES)[number]))) {
    if (bodyBranchId === undefined || bodyBranchId === null || bodyBranchId === "") {
      return null;
    }
    return bodyBranchId;
  }

  if (roles.includes("ADMIN_PROVINCE") && jwtUser.managedProvinceId) {
    if (bodyBranchId === undefined || bodyBranchId === null || bodyBranchId === "") {
      return null;
    }
    const ok = await provinceOwnsBranch(jwtUser.managedProvinceId, bodyBranchId);
    if (!ok) {
      throw new Error("Cabang tidak termasuk provinsi Anda");
    }
    return bodyBranchId;
  }

  if (roles.includes("ADMIN_BRANCH") && jwtUser.managedBranchId) {
    return jwtUser.managedBranchId;
  }

  if (roles.includes("ADMIN_DOJO") && jwtUser.managedDojoId) {
    const b = await resolveDojoBranchId(jwtUser.managedDojoId);
    if (!b) {
      throw new Error("Dojo Anda belum terhubung ke cabang");
    }
    return b;
  }

  return null;
}

export async function viewerCanMutateEvent(
  existing: { branchId: string | null; createdById: string | null },
  jwtUser: JwtEventUser,
): Promise<boolean> {
  const userId = jwtUser.userId;
  const roles = jwtUser.roles || [];

  if (roles.some((r) => SUPER_ROLES.includes(r as (typeof SUPER_ROLES)[number]))) {
    return true;
  }

  const isOwner = !!(userId && existing.createdById === userId);

  if (roles.includes("ADMIN_PROVINCE") && jwtUser.managedProvinceId) {
    if (existing.branchId === null) return isOwner;
    return await provinceOwnsBranch(jwtUser.managedProvinceId, existing.branchId);
  }

  if (roles.includes("ADMIN_BRANCH") && jwtUser.managedBranchId) {
    if (existing.branchId === null) return isOwner;
    return existing.branchId === jwtUser.managedBranchId;
  }

  if (roles.includes("ADMIN_DOJO") && jwtUser.managedDojoId) {
    const b = await resolveDojoBranchId(jwtUser.managedDojoId);
    if (!b) return isOwner;
    if (existing.branchId === null) return isOwner;
    return existing.branchId === b;
  }

  return isOwner;
}
