import { AppLayout } from "@/components/AppLayout";
import { RoleDetailPage } from "@/features/roles";
import { getRoleBySlug, getAllSlugs } from "@/features/roles";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const role = getRoleBySlug(slug);

  if (!role) {
    return {
      title: "Role Not Found — RoleBuddy",
      description: "This role ecosystem page does not exist.",
    };
  }

  return {
    title: `${role.title} — RoleBuddy`,
    description: `Explore the ${role.title} preparation community on RoleBuddy. ${formatCount(role.totalAspirants)} aspirants preparing, ${formatCount(role.activeToday)} active today.`,
  };
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default async function RoleDetailRoute({ params }: PageProps) {
  const { slug } = await params;

  return (
    <AppLayout>
      <RoleDetailPage slug={slug} />
    </AppLayout>
  );
}
