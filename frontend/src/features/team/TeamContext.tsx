import { createContext, type JSX, type ReactNode, use, useState } from "react";

import type { EntityRef } from "../../api/contract";
import { inTeam, TEAM_SIZE, type TeamMember, withMember, withoutMember } from "../../domain/team";

export interface Team {
  readonly members: readonly TeamMember[];
  readonly isFull: boolean;
  readonly has: (ref: EntityRef) => boolean;
  readonly add: (member: TeamMember) => void;
  readonly remove: (ref: EntityRef) => void;
}

const TeamContext = createContext<Team | null>(null);

/** The team being built across searches. */
export function TeamProvider({ children }: { readonly children: ReactNode }): JSX.Element {
  const [members, setMembers] = useState<readonly TeamMember[]>([]);
  const team: Team = {
    members,
    isFull: members.length >= TEAM_SIZE,
    has: (ref) => inTeam(members, ref),
    add: (member) => {
      setMembers((current) => withMember(current, member));
    },
    remove: (ref) => {
      setMembers((current) => withoutMember(current, ref));
    },
  };
  return <TeamContext value={team}>{children}</TeamContext>;
}

export function useTeam(): Team {
  const team = use(TeamContext);
  if (team === null) throw new Error("useTeam must be used inside a TeamProvider.");
  return team;
}
