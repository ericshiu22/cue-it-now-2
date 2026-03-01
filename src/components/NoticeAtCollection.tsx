import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NoticeAtCollectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NoticeAtCollection = ({ open, onOpenChange }: NoticeAtCollectionProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-lg">
            Notice at Collection (Beta Test)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Data collection disclosure
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            We are collecting your email address, approximate location, and app
            interaction data (clicks/navigation) to measure interest in Cue-It
            features.
          </p>

          <div>
            <h4 className="font-semibold text-foreground mb-1">Purpose</h4>
            <p>Market research and feature prioritization.</p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-1">
              Automated Decision-Making
            </h4>
            <p>
              This test may display hypothetical "Smart Churn" logic. This is
              for demonstration only and does not reflect actual financial
              outcomes.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-1">Your Rights</h4>
            <p>
              You have the right to opt-out of tracking or request deletion of
              your data at any time.
            </p>
          </div>
        </div>
        <div className="p-4 border-t border-border">
          <DialogClose asChild>
            <Button variant="secondary" className="w-full">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoticeAtCollection;
