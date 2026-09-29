import type { JSX } from "react";

import type { EntityRef } from "../../api/contract";
import { displayName } from "../../domain/entities";
import { Dialog } from "../../ui/Dialog";
import { Spinner } from "../../ui/Spinner";
import { DetailBody } from "./DetailBody";
import { useEntity } from "./useEntity";

interface EntityDialogProps {
  readonly entity: EntityRef;
  readonly onOpen: (ref: EntityRef) => void;
  readonly onClose: () => void;
}

function Content({ entity, onOpen }: Omit<EntityDialogProps, "onClose">): JSX.Element {
  const detail = useEntity(entity);
  if (detail.data !== undefined) return <DetailBody detail={detail.data} onOpen={onOpen} />;
  if (detail.isError) return <p className="text-muted">{detail.error.message}</p>;
  return <Spinner label="Loading the entry…" />;
}

/** The full entry of an entity, whose relations open in the same dialog. */
export function EntityDialog({ entity, onOpen, onClose }: EntityDialogProps): JSX.Element {
  return (
    <Dialog title={displayName(entity.name)} isOpen onClose={onClose}>
      <Content entity={entity} onOpen={onOpen} />
    </Dialog>
  );
}
