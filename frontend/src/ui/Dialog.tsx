import type { JSX, ReactNode } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";

import { Button } from "./Button";

type Placement = "sheet" | "center";

interface DialogProps {
  readonly title: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  /** A sheet slides in from the right edge; a centred dialog asks a short question. */
  readonly placement?: Placement;
  /** Small-caps words above the title, such as a folio. */
  readonly eyebrow?: string;
}

const MODAL: Readonly<Record<Placement, string>> = {
  sheet:
    "bg-paper-light shadow-sheet border-rule ml-auto h-dvh w-full max-w-[40rem] overflow-y-auto border-l " +
    "motion-safe:animate-[rise_200ms_ease-out]",
  center:
    "bg-paper-light border-ink/70 m-auto max-h-[90dvh] w-full max-w-2xl overflow-y-auto border " +
    "motion-safe:animate-[rise_150ms_ease-out]",
};

/** A modal dialog that traps the focus, closes on Escape and returns the focus on close. */
export function Dialog(props: DialogProps): JSX.Element {
  const { title, isOpen, onClose, children, placement = "sheet", eyebrow } = props;
  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className="bg-ink/25 fixed inset-0 z-40 flex p-0 sm:p-0"
    >
      <Modal className={MODAL[placement]}>
        <AriaDialog className="px-6 py-6 outline-none sm:px-10">
          <div className="border-ink mb-6 flex items-start justify-between gap-4 border-b pb-4">
            <div>
              {eyebrow === undefined ? null : <p className="label text-rubric mb-1">{eyebrow}</p>}
              <Heading slot="title" className="text-4xl leading-none">
                {title}
              </Heading>
            </div>
            <Button slot="close" variant="outline">
              Close
            </Button>
          </div>
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
