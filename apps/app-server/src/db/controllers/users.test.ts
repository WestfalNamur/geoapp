import { describe, it, expect } from "bun:test";
import { getUserByName } from "./users.js";

describe("getUserByName", () => {
    it("finds Jane by name", async () => {
        const user = await getUserByName("Jane");
        expect(user).not.toBeNull();
        expect(user!.name).toBe("Jane");
    });
});
