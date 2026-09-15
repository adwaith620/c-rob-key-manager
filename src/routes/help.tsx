import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeading } from "@/components/AppShell";
import { AnimatedSection, GradientText } from "@/components/crob";
import { Mail, Phone, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/help")({
  component: HelpSupport,
});

function HelpSupport() {
  return (
    <AppShell>
      <PageHeading 
        title={<><GradientText>Help</GradientText> & Support</>} 
        subtitle="Get assistance with the C-ROB Smart Key Locker system." 
      />
      <AnimatedSection animation="fade-in" delay={100}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 bg-card/60 backdrop-blur rounded-xl border border-border/50 space-y-4">
            <h2 className="text-xl font-semibold">Contact ExeCom</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              If you're facing issues with your key booking or need immediate access, please reach out to the ExeCom team.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="size-4 text-primary" />
                <a href="mailto:crob@tkmce.ac.in" className="hover:text-primary transition-colors">crob@tkmce.ac.in</a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="size-4 text-primary" />
                <span>+91 99999 99999</span>
              </div>
            </div>
          </div>
          <div className="p-6 bg-card/60 backdrop-blur rounded-xl border border-border/50 space-y-4">
            <h2 className="text-xl font-semibold">FAQs</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm">How do I cancel a booking?</h3>
                <p className="text-xs text-muted-foreground mt-1">You can cancel your own booking from the Member Dashboard under the "Upcoming Bookings" section.</p>
              </div>
              <div>
                <h3 className="font-medium text-sm">What is a Team Booking?</h3>
                <p className="text-xs text-muted-foreground mt-1">Team bookings allow you to reserve the locker for group projects (2-30 members).</p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </AppShell>
  );
}
