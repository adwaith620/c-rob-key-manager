import { createFileRoute } from "@tanstack/react-router";
import { ExecomLayout } from "@/components/execom/ExecomLayout";

export const Route = createFileRoute("/execom")({
  component: ExecomLayout,
});
