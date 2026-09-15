import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeading } from "@/components/AppShell";
import { AnimatedSection, GradientText } from "@/components/crob";
import { Info } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutUs,
});

function AboutUs() {
  return (
    <AppShell>
      <PageHeading 
        title={<><GradientText>About</GradientText> Us</>} 
        subtitle="Learn more about C-ROB and the Smart Key Locker project." 
      />
      <AnimatedSection animation="fade-in" delay={100}>
        <div className="max-w-3xl p-6 md:p-8 bg-card/60 backdrop-blur rounded-xl border border-border/50 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Info className="size-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">C-ROB Smart Key Locker</h2>
          </div>
          
          <p className="text-muted-foreground leading-relaxed">
            The C-ROB Smart Key Locker is an IoT-enabled key management system designed to streamline access to the robotics lab. It replaces the traditional manual logbook with a secure, automated, and trackable digital platform.
          </p>
          
          <div className="space-y-3 pt-4">
            <h3 className="text-lg font-semibold text-foreground/90">Key Features</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-1">
              <li>Role-based access control (Members, ExeCom, Admin)</li>
              <li>Automated conflict-free slot booking</li>
              <li>Real-time IoT key access and return tracking</li>
              <li>Comprehensive session and audit logging</li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-border/30">
            <p className="text-sm text-center text-muted-foreground">
              Developed for C-ROB, TKM College of Engineering.
            </p>
          </div>
        </div>
      </AnimatedSection>
    </AppShell>
  );
}
