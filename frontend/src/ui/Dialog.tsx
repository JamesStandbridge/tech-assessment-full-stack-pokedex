import type { JSX, ReactNode } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";

import { Button } from "./Button";

interface DialogProps {
  readonly title: string;
  /** A catalogue label above the title, such as the kind of the entry. */
  readonly eyebrow?: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

/** A modal dialog that traps the focus, closes on Escape and returns the focus on close. */
export function Dialog({ title, eyebrow, isOpen, onClose, children }: DialogProps): JSX.Element {
  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className="bg-ink/85 fixed inset-0 z-40 grid place-items-center p-3 sm:p-6"
    >
      <Modal className="plate scroll-area max-h-[90dvh] w-full max-w-2xl">
        <AriaDialog className="p-5 outline-none sm:p-7">
          <div className="border-line mb-5 flex items-start justify-between gap-4 border-b pb-4">
            <div className="min-w-0">
              {eyebrow === undefined ? null : (
                <p className="catalogue text-accent mb-1">{eyebrow}</p>
              )}
              <Heading
                slot="title"
                className="font-display text-3xl leading-none font-semibold sm:text-4xl"
              >
                {title}
              </Heading>
            </div>
            <Button slot="close" variant="outline" size="small">
              Close
              <kbd aria-hidden="true">Esc</kbd>
            </Button>
          </div>
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
