import { ArrowDown, Bath, BedDouble, CalendarCheck, Languages, MessageCircle, ShieldCheck, Users, Waves } from "lucide-react";
import { HOUSE_INFO, RULES, SEASON_LABELS, VILLA, type Season } from "./data/property";
import { GALLERY, HERO_PHOTO } from "./data/photos";
import { Assistant, askAssistant } from "./components/Assistant";
import { LanternMark } from "./components/LanternMark";

const SEASONS = Object.keys(SEASON_LABELS) as Season[];
const REPO = "https://github.com/marinviskovic/guest-assistant";

const FACTS = [
  { icon: Users, text: `Up to ${VILLA.maxGuests} guests` },
  { icon: BedDouble, text: `${VILLA.bedrooms} bedrooms` },
  { icon: Bath, text: `${VILLA.bathrooms} bathrooms` },
  { icon: Waves, text: "Private pool" },
];

// The first photo is the large one; the rest fill the grid beside it.
const TILE = ["col-span-2 row-span-2", "col-span-2", "", ""];

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
          <a href="#villa" className="hidden rounded-full px-3 py-2 text-ink-soft hover:text-ink sm:inline-block">The villa</a>
          <a href="#info" className="hidden rounded-full px-3 py-2 text-ink-soft hover:text-ink sm:inline-block">Good to know</a>
          <a href="#ask" className="rounded-full bg-sea-deep px-4 py-2 font-medium text-limestone hover:bg-sea">Ask a question</a>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-10 pb-14 sm:px-6 md:grid-cols-[1.05fr_1fr] md:gap-12 md:pt-16 md:pb-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium tracking-[0.06em] text-ink-soft uppercase">
              <span className="size-1.5 rounded-full bg-lantern" aria-hidden="true" />
              Concept · near Rovinj, Istria
            </p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.04] text-sea-deep sm:text-6xl">
              A villa with a pool above the sea, and answers at any hour.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Ask about the pool, check-in or a free week in July. The guest assistant answers in your language from the host's
              own house rules, checks the calendar and prepares your booking request.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#ask" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-lantern px-6 font-medium text-sea-deep shadow-[0_10px_30px_-12px_rgba(232,131,58,0.8)] hover:brightness-105">
                Ask the assistant
                <ArrowDown className="size-4" aria-hidden="true" />
              </a>
              <a href="#villa" className="inline-flex min-h-12 items-center rounded-full border border-sea/30 px-6 font-medium text-sea hover:border-sea">
                See the villa
              </a>
            </div>
          </div>
          <figure className="relative">
            <img
              src={HERO_PHOTO.src}
              alt={HERO_PHOTO.alt}
              width={HERO_PHOTO.width}
              height={HERO_PHOTO.height}
              fetchPriority="high"
              className="aspect-[4/3] w-full rounded-[28px] object-cover shadow-[0_30px_60px_-25px_rgba(15,47,60,0.55)]"
            />
            <figcaption className="absolute bottom-4 left-4 rounded-full bg-paper/90 px-3.5 py-1.5 text-sm font-medium text-sea-deep backdrop-blur">
              Heated hot tub with a sea view
            </figcaption>
          </figure>
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

        <section id="villa" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-16 sm:px-6 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div>
              <h2 className="text-4xl text-sea-deep sm:text-5xl">The villa</h2>
              <p className="mt-3 max-w-2xl text-lg text-ink-soft">
                The whole house is yours: a pool, a garden above the sea and a path down to a pebble cove, 3 km from Rovinj old
                town.
              </p>
            </div>
            <ul className="flex flex-wrap gap-2 text-sm">
              {FACTS.map(({ icon: Icon, text }) => (
                <li key={text} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5">
                  <Icon className="size-4 text-sea" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 grid auto-rows-[9rem] grid-cols-2 gap-3 sm:auto-rows-[11rem] md:grid-cols-4">
            {GALLERY.map((photo, i) => (
              <img
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
                className={`h-full w-full rounded-2xl object-cover ${TILE[i] ?? ""}`}
              />
            ))}
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {[
              { title: "Rooms", items: VILLA.rooms },
              { title: "What guests love", items: VILLA.highlights },
            ].map((list) => (
              <div key={list.title}>
                <h3 className="text-2xl text-sea-deep">{list.title}</h3>
                <ul className="mt-3 space-y-1.5 text-[15px] leading-relaxed">
                  {list.items.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="mt-2.5 size-1 shrink-0 rounded-full bg-lantern" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 overflow-hidden rounded-[28px] border border-line bg-paper">
            <table className="tabular w-full text-left text-[15px]">
              <caption className="px-4 pt-5 text-left sm:px-6 font-display text-xl font-semibold text-sea-deep">Prices for the whole villa</caption>
              <thead>
                <tr className="border-b border-line text-sm text-ink-soft">
                  <th scope="col" className="px-4 py-3 sm:px-6 font-medium">Season</th>
                  <th scope="col" className="px-4 py-3 sm:px-6 font-medium">Per night</th>
                  <th scope="col" className="px-4 py-3 sm:px-6 font-medium">Minimum stay</th>
                </tr>
              </thead>
              <tbody>
                {SEASONS.map((season) => (
                  <tr key={season} className="border-b border-line last:border-0">
                    <th scope="row" className="px-4 py-3 sm:px-6 font-normal">{SEASON_LABELS[season]}</th>
                    <td className="px-4 py-3 sm:px-6">€{VILLA.rates[season]}</td>
                    <td className="px-4 py-3 sm:px-6">{RULES.minNights[season]} nights</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-4 py-4 sm:px-6">
              <p className="max-w-2xl text-sm text-ink-soft">
                Plus a cleaning fee of €{VILLA.cleaningFee} per stay and tourist tax of €{RULES.touristTaxPerNight} per night for
                guests aged 12 and over. Closed from November to March.
              </p>
              <button
                type="button"
                onClick={() => askAssistant("Is the villa free from ")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-sea/30 px-5 text-sm font-medium text-sea hover:border-sea"
              >
                <CalendarCheck className="size-4" aria-hidden="true" />
                Ask about dates
              </button>
            </div>
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
            Concept website for a portfolio. Photos are used with the owner's permission. The villa's name, location, prices and
            host are fictional, and booking requests aren't sent to anyone.
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
