import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsOfServiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsOfService = ({ open, onOpenChange }: TermsOfServiceProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-lg">
            Cue-It: Beta Terms of Service & Disclaimers
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Version 1.0 — February 2026
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="px-6 pb-6 max-h-[60vh]">
          <div className="space-y-5 text-sm text-muted-foreground leading-relaxed pr-4">
            <section>
              <h3 className="font-semibold text-foreground mb-1">
                1. Nature of the Service
              </h3>
              <p>
                You acknowledge that Cue-It is currently in a market-validation
                and testing phase. The application is not a finished product. We
                are providing access solely to gauge interest, measure
                popularity, and collect usage data to inform future development.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>Temporary Access:</strong> We reserve the right to
                  modify, suspend, or terminate this test and your access at any
                  time, for any reason, without notice or liability.
                </li>
                <li>
                  <strong>No Guarantee of Launch:</strong> Participation does not
                  guarantee a final version of Cue-It will be released or that
                  any data you enter will be preserved.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-1">
                2. "Smart Churn" & Savings Disclaimer
              </h3>
              <p>
                Any calculations, cost-benefit analyses, or "Smart Churn"
                recommendations are for informational and educational purposes
                only.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>User-Provided Data:</strong> All results are based on
                  information you manually enter. We do not independently verify
                  accuracy of your subscription costs, billing dates, or
                  third-party terms.
                </li>
                <li>
                  <strong>Hypothetical Estimates:</strong> Savings figures are
                  approximations. Actual savings may vary based on taxes,
                  "grandfathered" rate losses, or mid-cycle penalties.
                </li>
                <li>
                  <strong>No Professional Advice:</strong> Cue-It does not
                  provide financial, legal, or tax advice. Consult your own
                  records before making decisions.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-1">
                3. Third-Party Services & Liability
              </h3>
              <p>
                Cue-It is a management tool and is not affiliated with,
                endorsed by, or partnered with Netflix, Disney+, Max, or any
                other streaming service provider unless explicitly stated.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>Final Responsibility:</strong> You remain solely
                  responsible for your obligations to third-party providers.
                </li>
                <li>
                  <strong>No Liability for Charges:</strong> Cue-It is not
                  liable for any fees, renewals, or loss of access resulting from
                  your use of the app's recommendations.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-1">
                4. Automated Decision-Making (ADMT) Disclosure
              </h3>
              <p>
                In compliance with 2026 California privacy regulations, the
                "Smart Churn" engine uses automated technology to analyze usage
                patterns and suggest cancellations.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>Human Review:</strong> All automated recommendations
                  require your explicit confirmation before any action is taken.
                </li>
                <li>
                  <strong>Opt-Out:</strong> You may disable automated
                  recommendations at any time in the app settings.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-1">
                5. 2026 Data & Privacy
              </h3>
              <p>
                By registering, you consent to our collection of
                "Intent-to-Watch" and usage data.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>Purpose:</strong> Data is used exclusively to measure
                  feature demand.
                </li>
                <li>
                  <strong>Right to Delete:</strong> You may request immediate
                  deletion of your testing data at any time.
                </li>
                <li>
                  <strong>Age Requirement:</strong> This test is restricted to
                  users 18 years of age or older.
                </li>
              </ul>
            </section>
          </div>
        </ScrollArea>
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

export default TermsOfService;
