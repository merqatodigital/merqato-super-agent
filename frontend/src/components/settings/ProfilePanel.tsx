import { Building2, Check, UserRound } from "lucide-react";
import { Field, SelectInput, TextArea, TextInput } from "../ui/Primitives";
import { useApp } from "../../store/AppContext";
import type { BusinessInfo, OperatorInfo } from "../../types";

const INDUSTRIES = ["Hospitality", "SaaS", "Finance", "Retail", "Healthcare", "Logistics", "Real Estate", "Other"];
const SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

/**
 * The permanent company + operator record. Onboarding captures a few of these
 * fields once; everything is editable here afterwards and every change flows
 * straight into the sidebar, the agent system prompt and the backend payload.
 */
export function ProfilePanel() {
  const { settings, updateSettings } = useApp();
  const b = settings.business;
  const o = settings.operator;

  const setBusiness = (patch: Partial<BusinessInfo>) =>
    updateSettings({ business: { ...b, ...patch } });
  const setOperator = (patch: Partial<OperatorInfo>) =>
    updateSettings({ operator: { ...o, ...patch } });

  return (
    <>
      <section className="panel space-y-4 p-5 xl:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <Building2 size={16} className="text-cyan" />
          <h2 className="font-display text-lg tracking-[0.16em] text-white">COMPANY PROFILE</h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/60">
            <Check size={12} className="text-ok" /> Saved automatically
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Trading name">
            <TextInput value={b.name} onChange={(e) => setBusiness({ name: e.target.value })} placeholder="Northwind" />
          </Field>
          <Field label="Legal / registered name">
            <TextInput
              value={b.legalName}
              onChange={(e) => setBusiness({ legalName: e.target.value })}
              placeholder="Northwind Holdings Ltd"
            />
          </Field>
          <Field label="Tax / registration ID">
            <TextInput value={b.taxId} onChange={(e) => setBusiness({ taxId: e.target.value })} placeholder="VAT / EIN" />
          </Field>

          <Field label="Industry">
            <SelectInput value={b.industry} onChange={(e) => setBusiness({ industry: e.target.value })}>
              <option value="">Select…</option>
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Company size">
            <SelectInput value={b.size} onChange={(e) => setBusiness({ size: e.target.value })}>
              <option value="">Select…</option>
              {SIZES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Timezone">
            <TextInput
              value={b.timezone}
              onChange={(e) => setBusiness({ timezone: e.target.value })}
              placeholder="Europe/London"
            />
          </Field>

          <Field label="Company email">
            <TextInput
              type="email"
              value={b.email}
              onChange={(e) => setBusiness({ email: e.target.value })}
              placeholder="hello@company.com"
            />
          </Field>
          <Field label="Company phone">
            <TextInput
              type="tel"
              value={b.phone}
              onChange={(e) => setBusiness({ phone: e.target.value })}
              placeholder="+44 20 7946 0000"
            />
          </Field>
          <Field label="Website">
            <TextInput
              value={b.website}
              onChange={(e) => setBusiness({ website: e.target.value })}
              placeholder="https://company.com"
            />
          </Field>
        </div>

        <div className="border-t border-cyan/10 pt-4">
          <div className="mb-3 text-[10px] tracking-[0.18em] text-white/70">REGISTERED ADDRESS</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <Field label="Address line 1">
                <TextInput
                  value={b.addressLine1}
                  onChange={(e) => setBusiness({ addressLine1: e.target.value })}
                  placeholder="12 Harbour Street"
                />
              </Field>
            </div>
            <Field label="Address line 2">
              <TextInput
                value={b.addressLine2}
                onChange={(e) => setBusiness({ addressLine2: e.target.value })}
                placeholder="Suite 400"
              />
            </Field>
            <Field label="City">
              <TextInput value={b.city} onChange={(e) => setBusiness({ city: e.target.value })} placeholder="London" />
            </Field>
            <Field label="State / region">
              <TextInput value={b.region} onChange={(e) => setBusiness({ region: e.target.value })} />
            </Field>
            <Field label="Postal code">
              <TextInput
                value={b.postalCode}
                onChange={(e) => setBusiness({ postalCode: e.target.value })}
                placeholder="EC1A 1BB"
              />
            </Field>
            <Field label="Country">
              <TextInput
                value={b.country}
                onChange={(e) => setBusiness({ country: e.target.value })}
                placeholder="United Kingdom"
              />
            </Field>
          </div>
        </div>

        <div className="border-t border-cyan/10 pt-4">
          <Field label="What the agents should know about this business">
            <TextArea
              rows={4}
              value={b.description}
              onChange={(e) => setBusiness({ description: e.target.value })}
              placeholder="Operations, tone of voice, constraints, who the customers are…"
            />
          </Field>
          <p className="mt-2 text-[11px] leading-relaxed text-white/60">
            The company profile is sent as system context on every agent request. Edits apply immediately — there is no
            need to repeat onboarding.
          </p>
        </div>
      </section>

      <section className="panel space-y-4 p-5 xl:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <UserRound size={16} className="text-cyan" />
          <h2 className="font-display text-lg tracking-[0.16em] text-white">PRIMARY CONTACT</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Full name">
            <TextInput value={o.name} onChange={(e) => setOperator({ name: e.target.value })} placeholder="Alex Moore" />
          </Field>
          <Field label="Role / title">
            <TextInput
              value={o.role}
              onChange={(e) => setOperator({ role: e.target.value })}
              placeholder="Operations Director"
            />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              value={o.email}
              onChange={(e) => setOperator({ email: e.target.value })}
              placeholder="alex@company.com"
            />
          </Field>
          <Field label="Phone">
            <TextInput
              type="tel"
              value={o.phone}
              onChange={(e) => setOperator({ phone: e.target.value })}
              placeholder="+44 7700 900000"
            />
          </Field>
        </div>
      </section>
    </>
  );
}
