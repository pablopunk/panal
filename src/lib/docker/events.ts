import Docker from "dockerode";
import { logger } from "../logger";

const docker = new Docker();

export function startEventLogger() {
  const stream = docker.getEvents();
  stream.then((s) => {
    s.on("data", (d) => {
      try {
        const evt = JSON.parse(d.toString());
        logger.info({ dockerEvent: evt });
      } catch {}
    });
  });
}
