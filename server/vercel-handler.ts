import type { IncomingMessage, ServerResponse } from "node:http";
import { handleCreativeDirectionRequest } from "./api";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  void handleCreativeDirectionRequest(req, res);
}
