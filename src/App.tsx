import { ArrowDown, BedDouble, CalendarCheck, Languages, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { APARTMENTS, HOUSE_INFO, RULES, SEASON_LABELS, type Season } from "./data/property";
import { Assistant, askAssistant } from "./components/Assistant";
import { FloorPlan } from "./components/FloorPlan";
import { Illustration } from "./components/Illustration";
import { LanternMark } from "./components/LanternMark";

const SEASONS = Object.keys(SEASON_LABELS) as Season[];
const REPO = "https://github.com/marinviskovic/guest-assistant";

const FEATURES = [
  { icon: ShieldCheck, title: "Answers from the house rules", text: "It only uses the host's own information. When something isn't there, it says so and points to the host." },
  { icon: CalendarCheck, title: "Real dates and prices", text: "Free nights and every euro come from the booking calendar, never from the model's guesswork." },
  { icon: Languages, title: "Any language", text: "Guests write in German, Italian or Croatian and get the answer in the same language." },
  { icon: MessageCircle, title: "Request ready for WhatsApp", text: "It collects dates, guests and a name, then prepares the request the guest sends to the host." },
];

export default function App() {
  return (
    <>
      <a href="#ask" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        Skip to the assistant
      </a>

      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-5 sm:px-6">
        <a href="/" className="flex items-center gap-2.5 text-sea-deep">
          <LanternMark className="size-7" />
          <span className="font-display text-xl font-semibold tracking-tight">Sea Lantern</span>
        </a>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          <a href="#apartments" className="hidden rounded-full px-3 py-2 text-ink-soft hover:text-ink sm:inline-block">Apartments</a>
          <a href="#info" className="hidden rounded-full px-3 py-2 text-ink-soft hover:text-ink sm:inline-block">Good to know</a>
          <a href="#ask" className="rounded-full bg-sea-deep px-4 py-2 font-medium text-limestone hover:bg-sea">Ask a question</a>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-10 pb-14 sm:px-6 md:grid-cols-[1.05fr_1fr] md:gap-12 md:pt-16 md:pb-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium tracking-[0.06em] text-ink-soft uppercase">
              <span className="size-1.5 rounded-full bg-lantern" aria-hidden="true" />
              Concept · Rovinj, Istria
            </p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.04] text-sea-deep sm:text-6xl">
              Two apartments by the sea, and answers at any hour.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Ask about parking, check-in or free dates in July. The guest assistant answers in your language from the host's
              own house rules, checks the calendar and prepares your booking request.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#ask" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-lantern px-6 font-medium text-sea-deep shadow-[0_10px_30px_-12px_rgba(232,131,58,0.8)] hover:brightness-105">
                Ask the assistant
                <ArrowDown className="size-4" aria-hidden="true" />
              </a>
              <a href="#apartments" className="inline-flex min-h-12 items-center rounded-full border border-sea/30 px-6 font-medium text-sea hover:border-sea">
                See the apartments
              </a>
            </div>
          </div>
          <Illustration className="h-auto w-full drop-shadow-[0_30px_40px_rgba(15,47,60,0.25)]" />
        </section>

        <section id="ask" className="scroll-mt-4 bg-sea-deep py-14 text-limestone md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-8">
            {/* On phones the chat comes straight after the intro; on wide screens it sits in the right column. */}
            <div className="lg:col-start-1 lg:row-start-1 lg:pt-6">
              <p className="text-sm font-medium tracking-[0.08em] text-lantern uppercase">Guest assistant</p>
              <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">Ask the way you'd ask the host.</h2>
              <p className="mt-4 text-lg leading-relaxed text-limestone/75">
                It runs on Claude and knows only what the host wrote down, so it won't invent a beach or a discount.
              </p>
            </div>
            <div className="text-ink lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <Assistant />
            </div>
            <ul className="grid content-start gap-5 sm:grid-cols-2 lg:col-start-1 lg:row-start-2 lg:grid-cols-1">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-limestone/10 text-lantern">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-sans text-base font-semibold tracking-normal">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-limestone/70">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="apartments" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-16 sm:px-6 md:py-24">
          <h2 className="text-4xl text-sea-deep sm:text-5xl">The apartments</h2>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">
            Both are a short walk from the old town, with air conditioning, free parking and linen included.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {Object.values(APARTMENTS).map((apartment) => (
              <article key={apartment.id} className="flex flex-col rounded-[28px] border border-line bg-paper p-5 sm:p-7">
                <div className="rounded-2xl bg-limestone p-4 text-sea">
                  <FloorPlan apartment={apartment.id} />
                </div>
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h3 className="text-2xl text-sea-deep">{apartment.name}</h3>
                  <p className="tabular shrink-0 text-sm text-ink-soft">
                    from <span className="text-lg font-semibold text-ink">€{apartment.rates.low}</span> / night
                  </p>
                </div>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                  <span className="inline-flex items-center gap-1.5"><Users className="size-4" aria-hidden="true" />Up to {apartment.maxGuests} guests</span>
                  <span className="inline-flex items-center gap-1.5"><BedDouble className="size-4" aria-hidden="true" />{apartment.sizeM2} m²</span>
                </p>
                <ul className="mt-4 flex-1 space-y-1.5 text-[15px] leading-relaxed">
                  {[apartment.beds, apartment.outdoor, apartment.kitchen, apartment.floor, apartment.petsAllowed ? "One dog welcome" : "No pets"].map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="mt-2.5 size-1 shrink-0 rounded-full bg-lantern" aria-hidden="true" />
                      <span className="first-letter:uppercase">{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => askAssistant(`Is ${apartment.name} free from `)}
                  className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full border border-sea/30 px-5 text-sm font-medium text-sea hover:border-sea"
                >
                  <CalendarCheck className="size-4" aria-hidden="true" />
                  Ask about dates
                </button>
              </article>
            ))}
          </div>

          <div className="mt-10 overflow-x-auto rounded-[28px] border border-line bg-paper">
            <table className="tabular w-full min-w-[520px] text-left text-[15px]">
              <caption className="px-6 pt-5 text-left font-display text-xl font-semibold text-sea-deep">Prices per night</caption>
              <thead>
                <tr className="border-b border-line text-sm text-ink-soft">
                  <th scope="col" className="px-6 py-3 font-medium">Season</th>
                  {Object.values(APARTMENTS).map((apartment) => (
                    <th key={apartment.id} scope="col" className="px-6 py-3 font-medium">{apartment.name}</th>
                  ))}
                  <th scope="col" className="px-6 py-3 font-medium">Minimum stay</th>
                </tr>
              </thead>
              <tbody>
                {SEASONS.map((season) => (
                  <tr key={season} className="border-b border-line last:border-0">
                    <th scope="row" className="px-6 py-3 font-normal">{SEASON_LABELS[season]}</th>
                    {Object.values(APARTMENTS).map((apartment) => (
                      <td key={apartment.id} className="px-6 py-3">€{apartment.rates[season]}</td>
                    ))}
                    <td className="px-6 py-3">{RULES.minNights[season]} nights</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-line px-6 py-4 text-sm text-ink-soft">
              Plus a cleaning fee of €{APARTMENTS.studio.cleaningFee} or €{APARTMENTS.mare.cleaningFee} per stay and tourist tax of €
              {RULES.touristTaxPerNight} per night for guests aged 12 and over. Closed from November to March.
            </p>
          </div>
        </section>

        <section id="info" className="scroll-mt-4 border-t border-line bg-paper py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-4xl text-sea-deep sm:text-5xl">Good to know</h2>
            <p className="mt-3 max-w-2xl text-lg text-ink-soft">This is everything the assistant knows. If it isn't here, it will tell you to ask the host.</p>
            <div className="mt-10 columns-1 gap-8 md:columns-2">
              {HOUSE_INFO.map((section) => (
                <section key={section.title} className="mb-8 break-inside-avoid">
                  <h3 className="text-xl text-sea-deep">{section.title}</h3>
                  <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-soft">
                    {section.items.map((item) => (
                      <li key={item} className="border-l-2 border-line pl-3">{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-sea-deep text-limestone/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl leading-relaxed">
            Concept website for a portfolio. Sea Lantern Apartments and the host are fictional, and booking requests aren't sent to anyone.
          </p>
          <p className="flex flex-wrap gap-x-5 gap-y-2">
            <span>Made by Webradiona</span>
            <a href={REPO} className="underline underline-offset-4 hover:text-white">Code on GitHub</a>
          </p>
        </div>
      </footer>
    </>
  );
}
