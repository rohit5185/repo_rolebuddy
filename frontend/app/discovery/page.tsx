import { DiscoveryPageV2 } from "@/features/connection";
import { AppLayout } from "@/components/AppLayout";

export const metadata = {
  title: "Discovery — RoleBuddy",
  description: "Find accountability partners preparing for the same role."
};

export default function Page() {
  return (
    <AppLayout>
      <DiscoveryPageV2 />
    </AppLayout>
  );
}
