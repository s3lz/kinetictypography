import type { IncomingMessage, ServerResponse } from "node:http";
import type { AudioFeatures } from "../src/types/audio";
import type { FontStylingContext } from "../src/types/fontMetadata";
import { generateCreativeDirectionFromGemini } from "./creativeDirector";
import { CreativeDirectionPipelineError } from "../src/lib/creativeDirectionPipeline";
import { checkRateLimit, getClientIp } from "./rateLimit";

type ApiRequest = IncomingMessage & { body?: unknown };

async function readJsonBody<T>(req: ApiRequest): Promise<T> {
  if (req.body !== undefined && req.body !== null) {
    return req.body as T;
  }

  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(body) as T;
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export async function handleCreativeDirectionRequest(
  req: ApiRequest,
  res: ServerResponse
) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const { allowed, retryAfterSec } = checkRateLimit(getClientIp(req));
  if (!allowed) {
    if (retryAfterSec) {
      res.setHeader("Retry-After", String(retryAfterSec));
    }
    sendJson(res, 429, {
      error: "Too many requests. Please try again later.",
      retryAfterSec,
    });
    return;
  }

  try {
    const body = await readJsonBody<{
      audioFeatures?: AudioFeatures;
      selectedFont?: FontStylingContext;
    }>(req);

    if (!body.audioFeatures) {
      sendJson(res, 400, { error: "Missing audioFeatures" });
      return;
    }

    if (!body.selectedFont) {
      sendJson(res, 400, { error: "Missing selectedFont" });
      return;
    }

    const creativeDirection = await generateCreativeDirectionFromGemini(
      body.audioFeatures,
      body.selectedFont
    );

    sendJson(res, 200, creativeDirection);
  } catch (error) {
    if (error instanceof CreativeDirectionPipelineError) {
      console.error("[CreativeDirector] API handler pipeline failure", {
        stage: error.stage,
        validationErrors: error.validationErrors,
        message: error.message,
      });
      sendJson(res, 422, {
        error: error.message,
        stage: error.stage,
        validationErrors: error.validationErrors,
      });
      return;
    }

    console.error("[CreativeDirector] API handler failed", error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Failed to generate creative direction",
    });
  }
}
