import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProgram } from "./program.js";

const generateCommandMock = vi.hoisted(() => vi.fn());

vi.mock("./commands/generate.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./commands/generate.js")>();
  return { ...actual, generateCommand: generateCommandMock };
});

describe("createProgram", () => {
  beforeEach(() => {
    generateCommandMock.mockReset();
    generateCommandMock.mockResolvedValue(undefined);
  });

  it.each(["generate", "import", "convert", "fetch", "gitignore"])(
    "should mark ignore as deprecated in %s feature help",
    (commandName) => {
      const command = createProgram().commands.find(
        (candidate) => candidate.name() === commandName,
      );

      expect(command?.helpInformation()).toContain("ignore is deprecated, use permissions");
    },
  );

  it("should mark the ignore scaffold as deprecated in add help", () => {
    const command = createProgram().commands.find((candidate) => candidate.name() === "add");

    expect(command?.description()).toContain("ignore is deprecated; use permissions");
  });

  describe("generate", () => {
    it("should forward --config to generateCommand as configPath", async () => {
      await createProgram().parseAsync(
        ["generate", "--config", "configs/alternate.jsonc", "--dry-run"],
        { from: "user" },
      );

      expect(generateCommandMock).toHaveBeenCalledTimes(1);
      const options = generateCommandMock.mock.calls[0]?.[1];
      expect(options).toMatchObject({ configPath: "configs/alternate.jsonc", dryRun: true });
      expect(options).not.toHaveProperty("config");
    });

    it("should forward the -c alias to generateCommand as configPath", async () => {
      await createProgram().parseAsync(["generate", "-c", "rulesync.ci.jsonc"], { from: "user" });

      expect(generateCommandMock.mock.calls[0]?.[1]).toMatchObject({
        configPath: "rulesync.ci.jsonc",
      });
    });

    it("should leave configPath undefined when --config is not given", async () => {
      await createProgram().parseAsync(["generate"], { from: "user" });

      expect(generateCommandMock.mock.calls[0]?.[1]).toMatchObject({ configPath: undefined });
    });

    it("should coerce --allow-symlink-escape=value to a boolean", async () => {
      // A bare optional-value option arrives as `true`, but one spelled
      // `=value` arrives as a string: a truthy "false" would turn the switch
      // on and let a global run write through links it was told not to.
      const forwarded = async (args: string[]): Promise<unknown> => {
        await createProgram().parseAsync(args, { from: "user" });
        const options = generateCommandMock.mock.calls[0]?.[1] as Record<string, unknown>;
        generateCommandMock.mockReset();
        generateCommandMock.mockResolvedValue(undefined);
        return options?.allowSymlinkEscape;
      };

      expect(await forwarded(["generate", "--allow-symlink-escape=false"])).toBe(false);
      expect(await forwarded(["generate", "--allow-symlink-escape=true"])).toBe(true);
      expect(await forwarded(["generate", "--allow-symlink-escape"])).toBe(true);
      expect(await forwarded(["generate"])).toBeUndefined();
    });

    it("should register --allow-symlink-escape on convert too", () => {
      const convert = createProgram().commands.find((candidate) => candidate.name() === "convert");

      expect(convert?.helpInformation()).toContain("--allow-symlink-escape");
    });
  });
});
