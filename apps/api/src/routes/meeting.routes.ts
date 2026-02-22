import { Router } from "express";
import { createMeetingSchema, patchMeetingSchema } from "@omniqr/shared";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import {
  createMeeting,
  getMeetingById,
  listMeetingsForOrganization,
  patchMeeting
} from "../services/meeting.service";

const router = Router();

router.get("/", requireAuth, async (request, response, next) => {
  try {
    const meetings = await listMeetingsForOrganization(request.user!.organizationId);
    response.status(200).json({ meetings });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("EDITOR"), validateBody(createMeetingSchema), async (request, response, next) => {
  try {
    const meeting = await createMeeting(request.user!.organizationId, request.user!.id, request.body);
    response.status(201).json({ meeting });
  } catch (error) {
    next(error);
  }
});

router.get("/:meetingId", requireAuth, async (request, response, next) => {
  try {
    const meeting = await getMeetingById(request.user!.organizationId, request.params.meetingId);

    if (!meeting) {
      response.status(404).json({ error: "Meeting not found" });
      return;
    }

    response.status(200).json({ meeting });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:meetingId",
  requireAuth,
  requireRole("EDITOR"),
  validateBody(patchMeetingSchema),
  async (request, response, next) => {
    try {
      const meeting = await patchMeeting(
        request.user!.organizationId,
        request.user!.id,
        request.user!.role,
        request.params.meetingId,
        request.body
      );

      if (!meeting) {
        response.status(404).json({ error: "Meeting not found" });
        return;
      }

      response.status(200).json({ meeting });
    } catch (error) {
      next(error);
    }
  }
);

export const meetingRouter = router;

