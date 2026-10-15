"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search, Users, Briefcase, Code2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { findMatch } from "@/features/matching";

import { getProfile } from "@/features/auth/auth.api";

import { getRoleDetail, searchRoles } from "./discovery.api";
import type { DiscoveryRoleAggregate, DiscoveryRoleUser } from "./types";

type DomainFilter = "all" | "tech" | "non-tech";

const TECH_COMMUNITY_CARDS = [
  { label: "Frontend Dev", keyword: "Frontend", icon: "⚛️" },
  { label: "Backend Dev", keyword: "Backend", icon: "🛠️" },
  { label: "Data / Analytics", keyword: "Data Analyst", icon: "📊" },
  { label: "DevOps / Cloud", keyword: "DevOps", icon: "☁️" },
  { label: "AI / ML", keyword: "ML Engineer", icon: "🤖" },
  { label: "Mobile Dev", keyword: "Mobile", icon: "📱" },
  { label: "Cybersecurity", keyword: "Security", icon: "🔐" },
  { label: "Product / UX", keyword: "Product Manager", icon: "🎯" },
];

const NON_TECH_COMMUNITY_CARDS = [
  { label: "Sales", keyword: "Sales", icon: "💼" },
  { label: "Marketing", keyword: "Marketing", icon: "📣" },
  { label: "Finance / Accounting", keyword: "Financial Analyst", icon: "💰" },
  { label: "HR / People Ops", keyword: "Recruiter", icon: "👥" },
  { label: "Operations", keyword: "Operations Analyst", icon: "⚙️" },
  { label: "Customer Success", keyword: "Customer Success", icon: "🤝" },
  { label: "Content / Writing", keyword: "Content Writer", icon: "✍️" },
  { label: "Strategy / Consulting", keyword: "Business Analyst", icon: "📋" },
];

function formatDailyGoal(goal: number | null) {
  if (!goal) {
    return "Not set";
  }

  return goal === 3 ? "3+" : `${goal}`;
}

export function DiscoveryPage() {
  const router = useRouter();
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [userDomain, setUserDomain] = useState<"tech" | "non-tech" | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [roles, setRoles] = useState<DiscoveryRoleAggregate[]>([]);
  const [selectedRole, setSelectedRole] = useState<DiscoveryRoleAggregate | null>(null);
  const [sampleUsers, setSampleUsers] = useState<DiscoveryRoleUser[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((res) => {
        if (!active) return;
        const domain = res.data.user.domain;
        if (domain === "tech" || domain === "non-tech") {
          setUserDomain(domain);
          setDomainFilter(domain);
        }
      })
      .catch(() => {
        // Ignore — fallback to "all"
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    async function loadRoles() {
      setIsSearching(true);

      try {
        const domain = domainFilter === "all" ? undefined : domainFilter;
        const response = await searchRoles(debouncedQuery, domain);
        setRoles(response.data);
        setError(null);

        if (!response.data.length) {
          setSelectedRole(null);
          setSampleUsers([]);
          return;
        }

        setSelectedRole((previous) => {
          if (!previous) {
            return response.data[0];
          }

          const selectedExists = response.data.some((item) => item.role.toLowerCase() === previous.role.toLowerCase());
          return selectedExists ? previous : response.data[0];
        });
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Unable to search roles.";

        if (/unauthorized|401|authentication required/i.test(message)) {
          router.replace("/login");
          return;
        }

        setError(message);
      } finally {
        setIsSearching(false);
      }
    }

    void loadRoles();
  }, [debouncedQuery, domainFilter, router]);

  useEffect(() => {
    if (!selectedRole) {
      setSampleUsers([]);
      return;
    }

    const activeRole = selectedRole;

    async function loadRoleDetail() {
      setIsLoadingDetail(true);
      try {
        const response = await getRoleDetail(activeRole.role);
        setSampleUsers(response.data.users);
        setError(null);
      } catch (detailError) {
        const message = detailError instanceof Error ? detailError.message : "Unable to load role detail.";

        if (/unauthorized|401|authentication required/i.test(message)) {
          router.replace("/login");
          return;
        }

        setError(message);
      } finally {
        setIsLoadingDetail(false);
      }
    }

    void loadRoleDetail();
  }, [router, selectedRole]);

  async function handleFindMatch() {
    setIsFindingMatch(true);
    setError(null);

    try {
      await findMatch();
      router.push("/dashboard");
    } catch (matchError) {
      const message = matchError instanceof Error ? matchError.message : "Unable to find a match right now.";
      setError(message);
    } finally {
      setIsFindingMatch(false);
    }
  }

  const selectedStats = useMemo(() => {
    if (!selectedRole) {
      return null;
    }

    const matchedUsers = Math.max(selectedRole.totalUsers - selectedRole.waitingUsers, 0);

    return {
      totalUsers: selectedRole.totalUsers,
      activeUsers: selectedRole.activeUsers,
      waitingUsers: selectedRole.waitingUsers,
      matchedUsers
    };
  }, [selectedRole]);

  const communityCards = domainFilter === "non-tech"
    ? NON_TECH_COMMUNITY_CARDS
    : domainFilter === "tech"
      ? TECH_COMMUNITY_CARDS
      : userDomain === "non-tech"
        ? NON_TECH_COMMUNITY_CARDS
        : userDomain === "tech"
          ? TECH_COMMUNITY_CARDS
          : [...TECH_COMMUNITY_CARDS.slice(0, 4), ...NON_TECH_COMMUNITY_CARDS.slice(0, 4)];

  function handleCommunityCardClick(keyword: string) {
    setQuery(keyword);
  }

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_right,_rgba(183,246,68,0.20),_transparent_35%),radial-gradient(circle_at_top_left,_rgba(85,75,249,0.14),_transparent_30%),linear-gradient(180deg,#fcf8ff_0%,#f6f4ff_55%,#fdfbff_100%)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 lg:gap-6">
        <header className="rounded-3xl border border-[#c7c4d9]/60 bg-white/90 px-5 py-6 shadow-[0_24px_80px_rgba(59,42,225,0.10)] backdrop-blur-xl sm:px-6 sm:py-7">
          <div className="space-y-3">
            <Badge variant="secondary">Community Discovery</Badge>
            <h1 className="text-3xl font-black tracking-tight text-[#1b1b24] sm:text-4xl">Find people preparing for the same role</h1>
            <p className="max-w-2xl text-sm leading-6 text-[#464556] sm:text-base">
              Search any role and inspect real-time pool strength before triggering matching.
            </p>
          </div>

          {/* Domain filter tabs */}
          <div className="mt-5 flex gap-2">
            {(["all", "tech", "non-tech"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => { setDomainFilter(filter); setQuery(""); }}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                  domainFilter === filter
                    ? "border-[#3b2ae1] bg-[#f0ecff] text-[#3b2ae1]"
                    : "border-[#c7c4d9]/60 bg-white text-[#777588] hover:border-[#8e87e6]"
                }`}
              >
                {filter === "tech" && <Code2 className="h-3.5 w-3.5" />}
                {filter === "non-tech" && <Briefcase className="h-3.5 w-3.5" />}
                {filter === "all" ? "All Communities" : filter === "tech" ? "Tech" : "Non-Tech"}
              </button>
            ))}
          </div>

          {/* Community quick-access cards */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {communityCards.map((card) => (
              <button
                key={card.keyword}
                type="button"
                onClick={() => handleCommunityCardClick(card.keyword)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all hover:border-[#3b2ae1]/30 hover:bg-[#f0ecff] ${
                  query === card.keyword
                    ? "border-[#3b2ae1]/30 bg-[#f0ecff] text-[#3b2ae1]"
                    : "border-[#c7c4d9]/40 bg-white text-[#464556]"
                }`}
              >
                <span className="text-base leading-none">{card.icon}</span>
                <span className="truncate">{card.label}</span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#c7c4d9]/60 bg-[#fcfbff] px-4 py-3">
            <Search className="h-4 w-4 text-[#777588]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-8 border-0 bg-transparent p-0"
              placeholder={domainFilter === "non-tech"
                ? "Search role: Sales Manager, Content Writer, HR Analyst..."
                : domainFilter === "tech"
                  ? "Search role: Backend Engineer, Data Analyst, DevOps..."
                  : "Search role: Backend, Sales Manager, Data Analyst..."
              }
              maxLength={50}
              aria-label="Search role"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-[#777588] hover:text-[#3b2ae1] text-xs font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </header>

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Unable to load discovery</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => router.refresh()}>Retry</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
            <Card>
              <CardHeader>
                <CardDescription>
                  {domainFilter === "all" ? "All Roles" : domainFilter === "tech" ? "Tech Roles" : "Non-Tech Roles"}
                </CardDescription>
                <CardTitle>Search results</CardTitle>
              </CardHeader>
              <CardContent>
                {isSearching ? (
                  <div className="flex items-center gap-2 text-sm text-[#464556]">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading role counts...
                  </div>
                ) : roles.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-[#464556]">No role found. Try another keyword or select a community card above.</p>
                    {query && (
                      <Button type="button" variant="secondary" onClick={() => setQuery("")} className="text-xs">
                        Clear search
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {roles.map((role) => {
                      const isSelected = selectedRole?.role.toLowerCase() === role.role.toLowerCase();
                      return (
                        <button
                          type="button"
                          key={role.role.toLowerCase()}
                          onClick={() => setSelectedRole(role)}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            isSelected
                              ? "border-[#3b2ae1] bg-[#f5f2ff] shadow-[0_12px_30px_rgba(59,42,225,0.10)]"
                              : "border-[#c7c4d9]/60 bg-white hover:border-[#8e87e6]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-bold text-[#1b1b24]">{role.role}</p>
                              <p className="text-xs uppercase tracking-[0.14em] text-[#777588]">Total: {role.totalUsers}</p>
                            </div>
                            <Badge className="bg-[#1f6d42] text-white">Active {role.activeUsers}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-[#464556]">Waiting users: {role.waitingUsers}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Role detail</CardDescription>
                <CardTitle>{selectedRole ? selectedRole.role : "Select a role"}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {selectedStats ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#c7c4d9]/60 bg-[#fcfbff] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#777588]">Total users</p>
                      <p className="mt-1 text-3xl font-black text-[#1b1b24]">{selectedStats.totalUsers}</p>
                    </div>
                    <div className="rounded-2xl border border-[#c7c4d9]/60 bg-[#fcfbff] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#777588]">Active users (24h)</p>
                      <p className="mt-1 text-3xl font-black text-[#1b1b24]">{selectedStats.activeUsers}</p>
                    </div>
                    <div className="rounded-2xl border border-[#c7c4d9]/60 bg-[#fcfbff] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#777588]">Waiting users</p>
                      <p className="mt-1 text-3xl font-black text-[#1b1b24]">{selectedStats.waitingUsers}</p>
                    </div>
                    <div className="rounded-2xl border border-[#c7c4d9]/60 bg-[#fcfbff] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#777588]">Matched users</p>
                      <p className="mt-1 text-3xl font-black text-[#1b1b24]">{selectedStats.matchedUsers}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#464556]">Pick a role from the list to inspect details.</p>
                )}

                <div className="rounded-2xl border border-[#c7c4d9]/60 bg-[#fcfbff] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1b1b24]">
                    <Users className="h-4 w-4" />
                    Sample users
                  </div>
                  {!selectedRole ? (
                    <p className="text-sm text-[#464556]">No role selected.</p>
                  ) : isLoadingDetail ? (
                    <div className="flex items-center gap-2 text-sm text-[#464556]">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Loading sample users...
                    </div>
                  ) : sampleUsers.length === 0 ? (
                    <p className="text-sm text-[#464556]">No sample users available.</p>
                  ) : (
                    <div className="grid gap-2">
                      {sampleUsers.map((user, index) => (
                        <div key={`${user.status}-${index}`} className="rounded-xl border border-[#e0deeb] bg-white px-3 py-3 text-sm text-[#1b1b24]">
                          {/* Primary info row */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="space-y-0.5">
                              <p>Experience: <span className="font-semibold capitalize">{user.experience ?? "not set"}</span></p>
                              <p>Daily goal: <span className="font-semibold">{formatDailyGoal(user.dailyGoal)}</span></p>
                              <p>Status: <span className="font-semibold capitalize">{user.status}</span></p>
                            </div>
                            {/* Active recently indicator */}
                            <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                              user.activeRecently
                                ? "border-[rgba(31,109,66,0.25)] bg-[#e6f5ec] text-[#1f6d42]"
                                : "border-[#e0deeb] bg-white text-[#777588]"
                            }`}>
                              {user.activeRecently ? "Active today" : "Inactive"}
                            </span>
                          </div>
                          {/* Progress indicators row */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#e0deeb]">
                            {user.reliabilityLabel && (
                              <span className="inline-flex items-center rounded-full border border-[rgba(31,109,66,0.2)] bg-[#e6f5ec] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1f6d42]">
                                {user.reliabilityLabel}
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-[#777588]">
                              {user.contributionCount ?? 0} contribution{(user.contributionCount ?? 0) !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="button" className="w-full" onClick={() => void handleFindMatch()} disabled={isFindingMatch || !selectedRole}>
                  {isFindingMatch ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  {isFindingMatch ? "Finding match" : "Find Match"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
