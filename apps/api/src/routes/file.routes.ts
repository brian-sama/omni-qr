import { Router } from "express";
import { completeUploadSchema, presignUploadSchema } from "@omniqr/shared";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import {
  completeUpload,
  createDownloadUrl,
  createPresignedUpload
} from "../services/file.service";

const router = Router();

router.post(
  "/presign-upload",
  requireAuth,
  requireRole("EDITOR"),
  validateBody(presignUploadSchema),
  async (request, response, next) => {
    try {
      const result = await createPresignedUpload(request.user!.organizationId, request.user!.id, request.body);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:fileId/complete",
  requireAuth,
  requireRole("EDITOR"),
  validateBody(completeUploadSchema),
  async (request, response, next) => {
    try {
      const result = await completeUpload(
        request.user!.organizationId,
        request.user!.id,
        request.params.fileId,
        request.body
      );

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/:fileId/access-url", requireAuth, requireRole("VIEWER"), async (request, response, next) => {
  try {
    const result = await createDownloadUrl(request.user!.organizationId, request.user!.id, request.params.fileId);
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export const fileRouter = router;

