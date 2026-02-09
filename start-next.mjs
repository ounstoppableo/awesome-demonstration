import "dotenv/config";
import { spawn } from "child_process";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
spawn("next", ["start", "-p", process.env.NEXT_PUBLIC_SERVER_PORT], {
  stdio: "inherit",
  shell: true,
});
