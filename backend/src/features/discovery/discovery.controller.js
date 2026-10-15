import { asyncHandler } from "../../utils/asyncHandler.js";
import { getRoleSampleUsersForViewer, searchRoleAggregates } from "./discovery.service.js";

export const searchRoles = asyncHandler(async (req, res) => {
  const domain = req.query.domain && ["tech", "non-tech"].includes(req.query.domain)
    ? req.query.domain
    : null;

  const roles = await searchRoleAggregates(req.query.q, domain);

  res.status(200).json({
    message: "Roles fetched successfully.",
    data: roles
  });
});

export const getRoleDetail = asyncHandler(async (req, res) => {
  const roleData = await getRoleSampleUsersForViewer(req.user._id, req.params.roleName);

  res.status(200).json({
    message: "Role detail fetched successfully.",
    data: roleData
  });
});
