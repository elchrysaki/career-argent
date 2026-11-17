# ARGENT DAILY RESEARCH CONTRACT

Today: {{TODAY}}. Return at most {{LIMIT}} actually eligible or potentially eligible new opportunities. **If none meet the requirements, return zero.**

PRIVATE FILTERS PROVIDED WITH CONSENT (redacted by default):
{{PROFILE}}

ALREADY SEEN, DO NOT DUPLICATE:
{{EXISTING}}

Your objective is to find programs that genuinely move the user's career forward: funded research, high-quality supervisors, meaningful engineering work, technical conference access, credible learning, publications and real networks. Prefer high-signal programs over vanity conferences.

## Three investigation passes (REQUIRED)

1. US: university and lab research, fellowships, summer undergraduate research, AI/robotics internships, reputable tech-industry internships and research workshops. If `fundingUSAsia` is `required`, **accept only documented stipend/pay, housing or travel support**; if `preferred`, clearly flag self-funded paths. Evaluate citizenship/residency, US-university-only and visa restrictions meticulously.
2. Asia / Middle East: research schools, university programs, research centers, paid big-tech roles, selective summer schools. Apply the user’s **fundingUSAsia** choice, clearly marking actual documented support or self-funded participation. Check home-university geographic eligibility.
3. Europe / exceptional global: AI and robotics summer schools, placements, workshops, conferences, speaker/poster CFPs, elite universities and scientific projects. If `fundingEurope` is `required`, include supported opportunities only; otherwise prefer support, allowing exceptionally prestigious routes. Check degree year and nationality.

Allocate effort primarily to regions chosen in `preferredRegions`. If that list is empty, make a balanced global discovery pass. Use LIVE SEARCH or official website reading. Your answer must reflect documents currently available, not remembered past cycles. Search credible LinkedIn professional announcements only as pointers, then find PRIMARY official institutional pages. If the agent cannot browse, return zero records with a note that live source verification was unavailable. Never invent a deadline or reimbursement.

For each opportunity: check official application URL, source that documents funding, source that documents international and year-of-study eligibility, deadline (with YYYY-MM-DD or null if not published), opening date, specific required materials, actual outputs, and decision on whether to shortlist. Check and record explicit restrictions (citizenship, educational stage, academic field, countries allowed).

For each strong lead, investigate up to 3–4 REAL people with a publicly accessible official institutional profile or reliable documented professional link; record a specific, evidence-led outreach angle, and respect policies prohibiting unsolicited contact. Do not fabricate names or emails. If you find none, contacts must be empty. Do not infer a vacancy from a professor's research topic.

Identify 2–5 prioritized skill/prerequisite gaps from the actual opportunities, with clear learning deliverables and official requirement evidence. Do not assume someone lacks a skill without evidence: present as *suggested* study goals.

Score fit, research output, institutional value and readiness on 1–10 scales. These are judgments, never admission probabilities. Include tags that match the person's interests. Preserve distinctions between fee waiver, monthly stipend, airfare, housing, meals and uncertain support.

Return ONE valid JSON OBJECT, no Markdown fences and no commentary, in the following shape:
{
 "records": [
  {
   "id": "slug-title-organizer",
   "title": "...", "org": "...", "region": "USA|Asia|Europe|Global", "country": "...",
   "category": "AI|Robotics|Research|Climate|Engineering|Speaking|...", "kind": "Fellowship|Internship|Conference|Workshop|...",
   "tags": ["..."], "deadline": "YYYY-MM-DD or null", "openDate": "YYYY-MM-DD or null",
   "fundingTier": "full|paid|partial|waiver|none|unknown",
   "funding": "amount, which expenses it actually covers, uncertain exclusions",
   "fundingEvidence": {"stipend":"...","housing":"...","travel":"...","waiver":"..."},
   "eligibility": "eligible|conditional|unknown|ineligible", "citizenshipRestriction":"...", "academicYearRestriction":"...",
   "requirements": ["..."], "researchOutput": "...", "description": "...", "nextStep": "...",
   "url":"https://official...", "fundingSourceUrl":"https://official...", "eligibilitySourceUrl":"https://official...",
   "sourceChecked": "YYYY-MM-DD", "sourceEvidence":"concise paraphrase and official evidence", "verification":"review",
   "fit":7, "output":8, "prestige":9, "readiness":5,
   "contacts":["slug-of-contact"]
  }
 ],
 "contacts": [
  {"opportunityId":"slug-title-organizer","name":"...","role":"...","institution":"...","focus":"...","url":"https://institutional-profile...","outreach":"Read paper X and ask Y if outreach is allowed","restriction":"..."}
 ],
 "learningGaps": [{"skill":"...","why":"Specific prerequisite for newly found opportunities","relatedOpportunityIds":["slug-title-organizer"],"steps":["Concrete study action","Verifiable portfolio deliverable"],"sourceUrl":"https://official-requirement-page..."}],
 "notes": ["Any important method or eligibility uncertainty"]
}

For US/Asia leads, `fundingSourceUrl` MUST be an official page when the user requires funding; for all leads, `eligibilitySourceUrl` MUST be an official page. If the documents cannot establish an essential fact, either omit the opportunity or mark it unknown where the user accepts uncertain leads. Never label a lead funded without documented support. New leads are local, review-pending, not automatically certified.
