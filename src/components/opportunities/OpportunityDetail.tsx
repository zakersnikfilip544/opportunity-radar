"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  MapPin,
  Clock,
  TrendingUp,
  Users,
  Lightbulb,
  Mail,
  Linkedin,
  Target,
  DollarSign,
  Building2,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { OPPORTUNITY_TYPE_CONFIG, URGENCY_CONFIG } from "@/types";
import type { Opportunity } from "@/types";
import {
  formatRelativeDate,
  parseValueRange,
  cn,
} from "@/lib/utils/helpers";

interface OpportunityDetailProps {
  opportunity: Opportunity;
  saved?: boolean;
  onSave?: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function OpportunityDetail({ opportunity: opp, saved, onSave }: OpportunityDetailProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "outreach" | "ai">("overview");
  const typeConfig = OPPORTUNITY_TYPE_CONFIG[opp.type];
  const urgencyConfig = URGENCY_CONFIG[opp.urgency];

  const scores = [
    { label: "Opportunity", value: opp.opportunity_score || 0 },
    { label: "Growth", value: opp.growth_score || 0 },
    { label: "Sales Potential", value: opp.sales_potential || 0 },
    { label: "Urgency", value: opp.urgency_score || 0 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to opportunities
      </Link>

      {/* Hero */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-md border",
                typeConfig.color
              )}
            >
              {typeConfig.icon} {typeConfig.label}
            </span>
            <span className={cn("text-sm font-medium", urgencyConfig.color)}>
              ● {urgencyConfig.label} urgency
            </span>
            {opp.is_verified && (
              <Badge variant="success" size="sm">✓ Verified</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onSave && (
              <Button variant="outline" size="sm" onClick={onSave}>
                {saved ? (
                  <><BookmarkCheck className="h-3.5 w-3.5 text-radar-400" /> Saved</>
                ) : (
                  <><Bookmark className="h-3.5 w-3.5" /> Save</>
                )}
              </Button>
            )}
            {opp.source_url && (
              <a href={opp.source_url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  <ExternalLink className="h-3.5 w-3.5" /> Source
                </Button>
              </a>
            )}
          </div>
        </div>

        <h1 className="text-lg sm:text-xl font-bold text-white mb-3 leading-tight">{opp.title}</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">{opp.summary}</p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
          {opp.country && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {opp.city ? `${opp.city}, ` : ""}{opp.country}
            </span>
          )}
          {opp.industry && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {opp.industry}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeDate(opp.published_at)}
          </span>
          {(opp.estimated_value_min || opp.estimated_value_max) && (
            <span className="flex items-center gap-1.5 text-radar-400 font-medium">
              <DollarSign className="h-3.5 w-3.5" />
              {parseValueRange(opp.estimated_value_min, opp.estimated_value_max, opp.estimated_value_currency)}
            </span>
          )}
        </div>

        {/* Company link */}
        {opp.company && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <Link
              href={`/companies/${opp.company.slug}`}
              className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors"
            >
              <div className="h-6 w-6 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                {opp.company.name[0]}
              </div>
              {opp.company.name}
              <ExternalLink className="h-3 w-3 text-zinc-600" />
            </Link>
          </div>
        )}
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {scores.map((s) => (
          <Card key={s.label} className="p-3 sm:p-4 flex flex-col items-center gap-2">
            <ScoreRing score={s.value} size="sm" />
            <span className="text-xs text-zinc-500 text-center">{s.label}</span>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
        {(["overview", "outreach", "ai"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded-md px-2 sm:px-4 py-3 sm:py-2 text-sm font-medium capitalize transition-all",
              activeTab === tab
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab === "ai" ? "AI Analysis" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid md:grid-cols-2 gap-4">
          {opp.why_it_matters && (
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">Why This Matters</h3>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400 leading-relaxed">{opp.why_it_matters}</p>
              </CardContent>
            </Card>
          )}

          {opp.suggested_action && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-radar-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">Suggested Action</h3>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400 leading-relaxed">{opp.suggested_action}</p>
              </CardContent>
            </Card>
          )}

          {(opp.potential_buyers?.length || opp.target_roles?.length) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">Who Should Act</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {opp.potential_buyers?.length && (
                  <div>
                    <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Potential Buyers</p>
                    <div className="flex flex-wrap gap-1.5">
                      {opp.potential_buyers.map((b) => (
                        <Badge key={b} variant="info" size="sm">{b}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {opp.target_roles?.length && (
                  <div>
                    <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Contact Roles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {opp.target_roles.map((r) => (
                        <Badge key={r} variant="default" size="sm">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {opp.services_to_offer?.length && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">Services to Offer</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {opp.services_to_offer.map((s) => (
                    <Badge key={s} className="bg-violet-500/10 text-violet-300 border-violet-500/20" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "outreach" && (
        <div className="space-y-4">
          {opp.cold_email && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-radar-400" />
                    <h3 className="text-sm font-semibold text-zinc-200">Cold Email Template</h3>
                  </div>
                  <CopyButton text={opp.cold_email} />
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
                  {opp.cold_email}
                </pre>
              </CardContent>
            </Card>
          )}

          {opp.linkedin_message && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-zinc-200">LinkedIn Message</h3>
                  </div>
                  <CopyButton text={opp.linkedin_message} />
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
                  {opp.linkedin_message}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "ai" && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-zinc-200">Full AI Analysis</h3>
            <p className="text-xs text-zinc-600 mt-0.5">
              Confidence: {opp.confidence_score || 0}/100 · Competition level: {opp.competition_level || 0}/100
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
              {opp.full_analysis || "No detailed analysis available."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {opp.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {opp.tags.map((tag) => (
            <Badge key={tag} variant="outline" size="sm">#{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
