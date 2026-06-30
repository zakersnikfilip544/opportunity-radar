"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { CompanyTimeline } from "@/components/companies/CompanyTimeline";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Building2, MapPin, Globe, Users, Calendar,
  Mail, Linkedin, TrendingUp, Zap, MessageSquare,
} from "lucide-react";
import Link from "next/link";
import type { Company, CompanyEvent, Opportunity } from "@/types";
import { getInitials } from "@/lib/utils/helpers";
import { OPPORTUNITY_TYPE_CONFIG, type OpportunityType } from "@/types";
import toast from "react-hot-toast";

const COUNTRY_FLAGS: Record<string, string> = {
  "Germany": "🇩🇪", "Slovenia": "🇸🇮", "Croatia": "🇭🇷", "France": "🇫🇷",
  "Netherlands": "🇳🇱", "Poland": "🇵🇱", "Austria": "🇦🇹", "Sweden": "🇸🇪",
  "United States": "🇺🇸", "Norway": "🇳🇴", "Slovakia": "🇸🇰", "UK": "🇬🇧",
  "Italy": "🇮🇹", "Spain": "🇪🇸",
};

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
      <div className="min-h-screen bg-zinc-950">
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
      <div className="min-h-screen bg-zinc-950">
        <Header title="Not Found" />
        <div className="px-8 py-20 text-center">
          <Building2 className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
          <p className="text-sm text-zinc-500 mb-4">Company not found.</p>
          <Link href="/companies" className="text-radar-400 text-sm hover:text-radar-300">← Back to companies</Link>
        </div>
      </div>
    );
  }

  const flag = company.country ? (COUNTRY_FLAGS[company.country] ?? "🌐") : null;
  const avgScore = opportunities.length
    ? Math.round(opportunities.reduce((s, o) => s + (o.opportunity_score ?? 0), 0) / opportunities.length)
    : null;
  const topType = opportunities.length
    ? opportunities.reduce<Record<string, number>>((acc, o) => {
        acc[o.type] = (acc[o.type] ?? 0) + 1;
        return acc;
      }, {})
    : {};
  const dominantType = Object.entries(topType).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Derive contact suggestions from opportunity data
  const coldEmail = opportunities.find((o) => o.cold_email)?.cold_email;
  const linkedinMsg = opportunities.find((o) => o.linkedin_message)?.linkedin_message;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header title={company.name} subtitle={company.industry ?? "Company"} />

      <div className="px-8 py-6 max-w-6xl space-y-6">
        <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to companies
        </Link>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            {/* Company card */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-radar-500/20 to-violet-600/20 border border-radar-500/30 flex items-center justify-center text-xl font-bold text-zinc-200 mb-3">
                    {getInitials(company.name)}
                  </div>
                  <h2 className="text-base font-bold text-white mb-1">{company.name}</h2>
                  {company.industry && (
                    <Badge variant="default" size="sm">{company.industry}</Badge>
                  )}
                </div>

                {company.description && (
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4 border-t border-zinc-800 pt-4">
                    {company.description}
                  </p>
                )}

                <div className="space-y-2.5">
                  {company.country && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <MapPin className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                      {flag} {company.city ? `${company.city}, ` : ""}{company.country}
                    </div>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-radar-400 hover:text-radar-300 transition-colors"
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      {company.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {company.linkedin_url && (
                    <a
                      href={company.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Linkedin className="h-3.5 w-3.5 shrink-0" />
                      LinkedIn Profile
                    </a>
                  )}
                  {company.employee_count_range && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Users className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                      {company.employee_count_range} employees
                    </div>
                  )}
                  {company.founded_year && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Calendar className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                      Founded {company.founded_year}
                    </div>
                  )}
                </div>

                {company.tags?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-wrap gap-1">
                    {company.tags.map((tag) => (
                      <Badge key={tag} variant="outline" size="sm">#{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Summary */}
            {opportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-radar-400" />
                    <h3 className="text-sm font-semibold text-zinc-200">AI Summary</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600">Opportunities</span>
                      <span className="text-sm font-bold text-zinc-200">{opportunities.length}</span>
                    </div>
                    {avgScore != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-600">Avg Score</span>
                        <span className={`text-sm font-bold ${avgScore >= 70 ? "text-green-400" : avgScore >= 50 ? "text-yellow-400" : "text-orange-400"}`}>
                          {avgScore} / 100
                        </span>
                      </div>
                    )}
                    {dominantType && OPPORTUNITY_TYPE_CONFIG[dominantType as OpportunityType] && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-600">Primary Signal</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${OPPORTUNITY_TYPE_CONFIG[dominantType as OpportunityType].color}`}>
                          {OPPORTUNITY_TYPE_CONFIG[dominantType as OpportunityType].icon} {OPPORTUNITY_TYPE_CONFIG[dominantType as OpportunityType].label}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-zinc-800">
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-radar-500 to-violet-500 rounded-full"
                          style={{ width: `${Math.min(100, (avgScore ?? 0))}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-700 mt-1.5">
                        {avgScore && avgScore >= 70
                          ? "High-value target — prioritize outreach"
                          : avgScore && avgScore >= 50
                          ? "Moderate potential — monitor closely"
                          : "Early signal — track for development"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-zinc-500" />
                  <h3 className="text-sm font-semibold text-zinc-200">Timeline</h3>
                </div>
              </CardHeader>
              <CardContent>
                <CompanyTimeline events={events} opportunities={opportunities} />
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="md:col-span-2 space-y-6">
            {/* Contact suggestions */}
            {(coldEmail || linkedinMsg) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                  <h3 className="text-sm font-semibold text-zinc-300">Suggested Outreach</h3>
                </div>
                {coldEmail && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Cold Email</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{coldEmail}</p>
                  </div>
                )}
                {linkedinMsg && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Linkedin className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">LinkedIn Message</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{linkedinMsg}</p>
                  </div>
                )}
              </div>
            )}

            {/* Opportunities */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-zinc-200">
                  Opportunities
                </h3>
                <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">{opportunities.length}</span>
              </div>
              {opportunities.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                  <Building2 className="h-7 w-7 text-zinc-700 mx-auto mb-3" />
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
    </div>
  );
}
