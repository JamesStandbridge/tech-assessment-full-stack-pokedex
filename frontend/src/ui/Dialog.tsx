import type { JSX, ReactNode } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";

import { Button } from "./Button";

interface DialogProps {
  readonly title: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

/** A modal dialog that traps the focus, closes on Escape and returns the focus on close. */
export function Dialog({ title, isOpen, onClose, children }: DialogProps): JSX.Element {
  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className="bg-ink/80 fixed inset-0 z-40 grid place-items-center p-4 backdrop-blur-sm"
    >
      <Modal className="rounded-card border-line bg-panel shadow-glow max-h-[90dvh] w-full max-w-2xl overflow-y-auto border">
        <AriaDialog className="p-6 outline-none">
          <div className="mb-4 flex items-start justify-between gap-4">
            <Heading slot="title" className="text-2xl font-semibold">
              {title}
            </Heading>
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
