"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { CompanyTimeline } from "@/components/companies/CompanyTimeline";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, MapPin, Globe, Users, Calendar } from "lucide-react";
import Link from "next/link";
import type { Company, CompanyEvent, Opportunity } from "@/types";
import { getInitials } from "@/lib/utils/helpers";
import toast from "react-hot-toast";

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/companies/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setCompany(data.company);
        setOpportunities(data.opportunities || []);
        setEvents(data.events || []);
      } catch {
        toast.error("Failed to load company");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div>
        <Header title="Company" />
        <div className="px-8 py-6 grid md:grid-cols-3 gap-6 max-w-6xl">
          <CardSkeleton />
          <div className="md:col-span-2 space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div>
        <Header title="Not Found" />
        <div className="px-8 py-20 text-center">
          <p className="text-zinc-500">Company not found.</p>
          <Link href="/companies" className="text-radar-400 text-sm mt-2 inline-block">← Back to companies</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={company.name} subtitle={company.industry || "Company"} />

      <div className="px-8 py-6 max-w-6xl space-y-6">
        <Link href="/companies" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200">
          <ArrowLeft className="h-4 w-4" />
          Back to companies
        </Link>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Company info */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-5">
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-300 mb-3">
                    {getInitials(company.name)}
                  </div>
                  <h2 className="text-base font-bold text-white">{company.name}</h2>
                  {company.industry && (
                    <Badge variant="default" size="sm" className="mt-1">{company.industry}</Badge>
                  )}
                </div>

                {company.description && (
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4">{company.description}</p>
                )}

                <div className="space-y-2">
                  {company.country && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {company.city ? `${company.city}, ` : ""}{company.country}
                    </div>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-radar-400 hover:text-radar-300"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {company.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {company.employee_count_range && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Users className="h-3.5 w-3.5" />
                      {company.employee_count_range} employees
                    </div>
                  )}
                  {company.founded_year && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Calendar className="h-3.5 w-3.5" />
                      Founded {company.founded_year}
                    </div>
                  )}
                </div>

                {company.tags?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {company.tags.map((tag) => (
                      <Badge key={tag} variant="outline" size="sm">#{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-zinc-200">Timeline</h3>
              </CardHeader>
              <CardContent>
                <CompanyTimeline events={events} opportunities={opportunities} />
              </CardContent>
            </Card>
          </div>

          {/* Opportunities */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200">
              Opportunities ({opportunities.length})
            </h3>
            {opportunities.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                <p className="text-sm text-zinc-600">No opportunities tracked yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} compact />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
