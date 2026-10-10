import {
  normalizeLowercaseStringOrEmpty,
  normalizeOptionalString,
} from "@openclaw/normalization-core/string-coerce";
import { listModelAliasCandidates } from "../../agents/model-selection-shared.js";
import type { OpenClawConfig } from "../../config/types.openclaw.js";
import type { SkillCommandSpec } from "../../skills/types.js";

export function reserveSkillCommandNames(params: {
  reservedCommands: Set<string>;
  skillCommands: SkillCommandSpec[];
}) {
  for (const command of params.skillCommands) {
    params.reservedCommands.add(normalizeLowercaseStringOrEmpty(command.name));
  }
}

export function resolveConfiguredDirectiveAliases(params: {
  cfg: OpenClawConfig;
  agentId?: string;
  commandTextHasSlash: boolean;
  reservedCommands: Set<string>;
}) {
  if (!params.commandTextHasSlash) {
    return [];
  }
  // Alias discovery merges the global defaults map with the agent's own
  // models map, matching /model <alias> and status summaries.
  return listModelAliasCandidates(params.cfg, params.agentId)
    .map((candidate) => normalizeOptionalString(candidate.alias))
    .filter((alias): alias is string => Boolean(alias))
    .filter((alias) => !params.reservedCommands.has(normalizeLowercaseStringOrEmpty(alias)));
}
