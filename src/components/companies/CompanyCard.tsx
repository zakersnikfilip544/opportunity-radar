import Link from "next/link";
import { Building2, MapPin, Users, ExternalLink } from "lucide-react";
import type { Company } from "@/types";
import { cn, getInitials } from "@/lib/utils/helpers";

interface CompanyCardProps {
  company: Company;
  opportunityCount?: number;
}

export function CompanyCard({ company, opportunityCount }: CompanyCardProps) {
  return (
    <Link href={`/companies/${company.slug}`}>
      <div className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-600 hover:bg-zinc-900">
        <div className="flex items-start gap-4">
          {/* Logo / Initial */}
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300 flex-shrink-0">
            {getInitials(company.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-radar-400 transition-colors truncate">
              {company.name}
            </h3>
            {company.description && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{company.description}</p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
          {company.industry && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {company.industry}
            </span>
          )}
          {company.country && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {company.country}
            </span>
          )}
          {company.employee_count_range && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {company.employee_count_range} zaposlenih
            </span>
          )}
          {opportunityCount !== undefined && (
            <span className="ml-auto text-radar-400 font-medium">
              {opportunityCount} priložnosti
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
