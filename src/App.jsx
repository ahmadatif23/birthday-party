import "./App.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { ADDONS, PACKAGES } from "./constants/package";
import { MOMENTS } from "./constants/photo";
import { FAQS } from "./constants/faq";
import { classNames, currency } from "./utils/strings";
import { goToSection } from "./utils/helpers";

export default function BirthdayPartyLandingPage() {
  const [shopItems, setShopItems] = useState([]);
  const [loadingShop, setLoadingShop] = useState(true);
  const [shopError, setShopError] = useState("");
  const abortRef = useRef(null);

  // ---- Booking form state ----
  const [form, setForm] = useState({
    name: "",
    lastname: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: 10,
    package: PACKAGES[0].id,
    addons: [],
    notes: "",
    agree: false,
  });
  const [formTouched, setFormTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Track last submission time in state
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const RATE_LIMIT_SECONDS = 10;

  // ---- Derived pricing ----
  const totals = useMemo(() => {
    const pkg = PACKAGES.find((p) => p.id === form.package);
    const addonTotal = ADDONS.filter((a) => form.addons.includes(a.id)).reduce(
      (s, a) => s + a.price,
      0
    );
    // Add per-guest cost beyond 10 guests
    const extraGuests = Math.max(0, Number(form.guests || 0) - 10);
    const perGuest = 8; // $8 per extra guest (food, utensils)
    const guestTotal = extraGuests * perGuest;
    return {
      base: pkg?.price || 0,
      addonTotal,
      guestTotal,
      grand: (pkg?.price || 0) + addonTotal + guestTotal,
    };
  }, [form.package, form.addons, form.guests]);

  // ---- Fetch dynamic content from public API ----
  useEffect(() => {
    setLoadingShop(true);
    setShopError("");
    const controller = new AbortController();
    abortRef.current = controller;

    fetch("https://fakestoreapi.com/products?limit=8&category=electronics", {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load shop items");
        return r.json();
      })
      .then((json) => setShopItems(json))
      .catch((err) => {
        if (err.name !== "AbortError")
          setShopError("Could not load products. Please try again later.");
      })
      .finally(() => setLoadingShop(false));

    return () => controller.abort();
  }, []);

  // ---- Form handlers ----
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleAddon = (id) =>
    update(
      "addons",
      form.addons.includes(id)
        ? form.addons.filter((x) => x !== id)
        : [...form.addons, id]
    );

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Valid email required";
    if (!/^(?:\+?60|0)[1-9]\d{7,9}$/.test(form.phone))
      errors.phone = "Valid Malaysian phone required";
    if (!form.date) errors.date = "Date required";
    if (!form.time) errors.time = "Time required";
    if (Number(form.guests) < 1) errors.guests = "At least 1 guest";
    if (!form.agree) errors.agree = "Please accept the terms";
    return errors;
  };

  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (formTouched && !submitted) setErrors(validate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, formTouched]);

  // ---- Form submission ----
  const onSubmit = (e) => {
    e.preventDefault();

    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_SECONDS * 1000) {
      alert(
        `Please wait ${RATE_LIMIT_SECONDS} seconds before submitting again.`
      );
      return;
    }

    // Honeypot check — if filled, ignore submission
    if (form.lastname && form.lastname.trim() !== "") {
      console.warn("Spam detected — submission ignored");
      return;
    }

    setFormTouched(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      console.log("Booking submitted", form, totals);

      setSubmitted(true);
      setLastSubmitTime(now); // update time of last submission

      // Reset minimal fields
      setForm((f) => ({
        ...f,
        name: "",
        lastname: "",
        email: "",
        phone: "",
        notes: "",
        agree: false,
      }));
      setTimeout(() => setSubmitted(false), 4000);
    }
  };

  // ---- Simple intersection fade-in ----
  useEffect(() => {
    const els = document.querySelectorAll("[data-fade]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting)
            e.target.classList.add("opacity-100", "translate-y-0");
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div
      id="home"
      className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-800"
    >
      {/* Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-theme-1 bg-theme-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a
            href="#home"
            onClick={(e) => goToSection(e, "home")}
            className="font-extrabold tracking-tight text-xl"
          >
            🎉 Party Bliss
          </a>

          <nav className="hidden md:flex gap-6 text-sm">
            <a
              href="#packages"
              onClick={(e) => goToSection(e, "packages")}
              className="hover:text-primary"
            >
              Packages
            </a>

            <a
              href="#gallery"
              onClick={(e) => goToSection(e, "gallery")}
              className="hover:text-primary"
            >
              Gallery
            </a>

            <a
              href="#shop"
              onClick={(e) => goToSection(e, "shop")}
              className="hover:text-primary"
            >
              Shop
            </a>

            <a
              href="#faq"
              onClick={(e) => goToSection(e, "faq")}
              className="hover:text-primary"
            >
              FAQ
            </a>
          </nav>

          <a
            href="#book"
            onClick={(e) => goToSection(e, "book")}
            className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-white shadow hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light"
          >
            Book Now
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-theme-1">
        <div className="pointer-events-none absolute left-10 top-20 h-60 w-60 rounded-full bg-pink-200 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-8 grid lg:grid-cols-2 gap-10 items-center">
          <div
            data-fade
            className="opacity-0 translate-y-6 transition-all duration-700"
          >
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Make their birthday{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-fuchsia-400">
                unforgettable
              </span>
            </h1>

            <p className="mt-4 text-lg text-slate-600 max-w-prose">
              Full-service birthday party planning & venue. From décor to
              dessert, we handle the magic so you can enjoy the moments.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#packages"
                onClick={(e) => goToSection(e, "packages")}
                className="rounded-2xl border border-slate-400 px-4 py-2 hover:border-primary-light hover:text-primary-light"
              >
                Explore Packages
              </a>

              <a
                href="#book"
                onClick={(e) => goToSection(e, "book")}
                className="rounded-2xl bg-slate-900 text-white px-5 py-2.5 hover:bg-slate-800"
              >
                Get a Quote
              </a>
            </div>

            <dl className="mt-8 pb-10 grid grid-cols-3 gap-4">
              {[
                ["500+", "Happy Parties"],
                ["4.9★", "Avg. Rating"],
                ["24/7", "Support"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-2xl border border-slate-400 p-4 text-center"
                >
                  <dt className="text-2xl font-bold">{k}</dt>
                  <dd className="text-slate-500 text-sm">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative z-10" data-fade>
            <div className="opacity-0 translate-y-6 transition-all duration-700" />

            <div className="lg:aspect-[5/3.5] md:aspect-[3/1.2] aspect-[2/1] -top-40 lg:absolute w-full mx-auto rounded-3xl bg-white p-2 shadow-xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1531956531700-dc0ee0f1f9a5?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Kids birthday party with balloons and cake"
                className="h-full w-full rounded-2xl object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-[0.1px] w-full translate-y-full">
          <svg
            width="100%"
            height="27"
            viewBox="0 0 1440 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0.324219 0H1439.68C1259.28 14.8232 676.299 34.9619 323.18 23.7322C-29.9396 12.5025 0.324219 0 0.324219 0Z"
              fill="#edf7f8"
            ></path>
          </svg>
        </div>
      </section>

      {/* Packages */}
      <section
        id="packages"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16"
      >
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold">Party Packages</h2>

          <p className="mt-2 text-slate-600">
            Clear pricing, zero stress. Pick a package and add fun extras.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PACKAGES.map((p) => (
            <article
              key={p.id}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={classNames(
                  "rounded-2xl text-gray-600 p-4 text-center font-bold",
                  "bg-gradient-to-r",
                  p.color
                )}
              >
                {p.name}
              </div>

              <div className="mt-4">
                <div className="text-3xl font-extrabold">
                  {currency(p.price)}
                </div>

                <p className="text-sm text-slate-500">
                  All-inclusive base price
                </p>
              </div>

              <ul className="mt-4 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span>✅</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={(e) => {
                  update("package", p.id);
                  goToSection(e, "book");
                }}
                className="mt-6 cursor-pointer w-full rounded-xl border border-[#27828c] py-2.5 text-[#27828c] font-medium hover:border-[#4da2ac] focus:outline-none"
              >
                Choose {p.name}
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="bg-white/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold">Moments We Love</h2>

            <p className="mt-2 text-slate-600">
              A peek at the joy we create, week after week.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOMENTS.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="Party moment"
                className="h-60 w-full rounded-2xl object-cover shadow-sm"
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Shop (Dynamic API) #daf0f2 fccfdd */}
      <section id="shop" className="relative w-full bg-theme-2">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold">Party Favors Shop</h2>

            <p className="mt-2 text-slate-600">
              Brighten up your celebration with our handpicked party goodies.
            </p>
          </div>

          {shopError && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
            >
              {shopError}
            </div>
          )}

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loadingShop
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="h-36 w-full rounded-xl bg-slate-200" />
                    <div className="mt-4 h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="mt-2 h-4 w-1/2 bg-slate-200 rounded" />
                    <div className="mt-4 h-6 w-24 bg-slate-200 rounded" />
                  </div>
                ))
              : shopItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl flex flex-col justify-between bg-white p-4 shadow-md hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-contain p-4"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>

                      <h3
                        className="mt-3 line-clamp-2 font-medium"
                        title={item.title}
                      >
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                        {item.category}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold">{currency(item.price)}</span>

                      <button className="cursor-pointer rounded-xl border border-slate-300 px-3 py-1.5 text-sm hover:border-primary hover:text-primary">
                        Buy
                      </button>
                    </div>
                  </article>
                ))}
          </div>
        </div>

        <div className="absolute w-full bottom-[0.1px] z-10 translate-y-full">
          <svg
            width="100%"
            height="27"
            viewBox="0 0 1440 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M1439.68 0H0.324219C180.723 14.8232 763.701 34.9619 1116.82 23.7322C1469.94 12.5025 1439.68 0 1439.68 0Z"
              fill="#daf0f2"
            ></path>
          </svg>
        </div>

        <div className="absolute w-full top-0 z-10 -translate-y-full">
          <svg
            width="100%"
            height="27"
            viewBox="0 0 1440 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M1439.68 27H0.324219C180.723 12.1768 763.701 -7.96191 1116.82 3.26778C1469.94 14.4975 1439.68 27 1439.68 27Z"
              fill="#daf0f2"
            ></path>
          </svg>
        </div>
      </section>

      {/* Booking form */}
      <section id="book" className="bg-white/60 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold">Enquiries & Bookings</h2>

            <p className="mt-2 text-slate-600">
              Tell us about your party. We'll confirm details and lock in your
              date.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {/* Summary Card */}
            <aside className="lg:col-span-1 h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-lg">Your Quote</h3>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Package</dt>
                  <dd className="font-medium capitalize">{form.package}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Base</dt>
                  <dd className="font-medium">{currency(totals.base)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Add-ons</dt>
                  <dd className="font-medium">{currency(totals.addonTotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Guests</dt>
                  <dd className="font-medium">{form.guests}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Extra guest total</dt>
                  <dd className="font-medium">{currency(totals.guestTotal)}</dd>
                </div>
              </dl>
              <div className="mt-4 border-t border-slate-200 pt-4 text-xl font-extrabold">
                {currency(totals.grand)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                * Estimate only. Taxes not included.
              </p>
            </aside>

            {/* Form */}
            <form
              onSubmit={onSubmit}
              className="lg:col-span-2 grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              {submitted && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
                >
                  🎉 Thanks! We received your enquiry. We'll get back to you
                  shortly.
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input
                    type="text"
                    className={classNames(
                      "mt-1 w-full rounded-xl border focus:outline-none px-3 py-2",
                      errors.name
                        ? "border-red-400"
                        : "border-slate-300 focus:border-primary"
                    )}
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Alex Tan"
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                <input
                  type="text"
                  name="lastname"
                  value={form.lastname || ""}
                  onChange={(e) =>
                    setForm({ ...form, lastname: e.target.value })
                  }
                  style={{ display: "none" }}
                  tabIndex="-1"
                  autoComplete="off"
                />

                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className={classNames(
                      "mt-1 w-full rounded-xl border focus:outline-none px-3 py-2",
                      errors.email
                        ? "border-red-400"
                        : "border-slate-300 focus:border-primary"
                    )}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="alex@example.com"
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    className={classNames(
                      "mt-1 w-full rounded-xl border focus:outline-none px-3 py-2",
                      errors.phone
                        ? "border-red-400"
                        : "border-slate-300 focus:border-primary"
                    )}
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+60 12-345 6789"
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium">Date</label>
                  <input
                    type="date"
                    className={classNames(
                      "mt-1 w-full rounded-xl border focus:outline-none px-3 py-2",
                      errors.date
                        ? "border-red-400"
                        : "border-slate-300 focus:border-primary"
                    )}
                    value={form.date}
                    onChange={(e) => update("date", e.target.value)}
                    aria-invalid={Boolean(errors.date)}
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-red-600">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium">Time</label>
                  <input
                    type="time"
                    className={classNames(
                      "mt-1 w-full rounded-xl border focus:outline-none px-3 py-2",
                      errors.time
                        ? "border-red-400"
                        : "border-slate-300 focus:border-primary"
                    )}
                    value={form.time}
                    onChange={(e) => update("time", e.target.value)}
                    aria-invalid={Boolean(errors.time)}
                  />
                  {errors.time && (
                    <p className="mt-1 text-xs text-red-600">{errors.time}</p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">Guests</label>
                  <input
                    type="number"
                    min={1}
                    className={classNames(
                      "mt-1 w-full rounded-xl border focus:outline-none px-3 py-2",
                      errors.guests
                        ? "border-red-400"
                        : "border-slate-300 focus:border-primary"
                    )}
                    value={form.guests}
                    onChange={(e) => update("guests", e.target.value)}
                    aria-invalid={Boolean(errors.guests)}
                  />
                  {errors.guests && (
                    <p className="mt-1 text-xs text-red-600">{errors.guests}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium">Package</label>
                  <select
                    className="mt-1 w-full rounded-xl border focus:outline-none focus:border-primary border-slate-300 px-3 py-2"
                    value={form.package}
                    onChange={(e) => update("package", e.target.value)}
                  >
                    {PACKAGES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {currency(p.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Add-ons</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {ADDONS.map((a) => (
                      <label
                        key={a.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.addons.includes(a.id)}
                          onChange={() => toggleAddon(a.id)}
                        />
                        {a.name} ({currency(a.price)})
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Notes (theme, allergies, requests)
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  rows={4}
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Princess theme, no peanuts, prefer morning slot…"
                />
              </div>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => update("agree", e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <a className="underline" href="javascript:void(0)">
                    terms & privacy
                  </a>
                  .
                </span>
              </label>
              {errors.agree && (
                <p className="-mt-2 text-xs text-red-600">{errors.agree}</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-2xl cursor-pointer bg-primary px-5 py-2.5 text-white font-medium hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light"
                >
                  Submit Enquiry
                </button>
                <p className="text-xs text-slate-500">
                  We’ll reply within 1 business day.
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="absolute w-full bottom-0 z-10 translate-y-full">
          <svg
            width="100%"
            height="27"
            viewBox="0 0 1440 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0.324219 0H1439.68C1259.28 17 676.299 40 323.18 26.5C-29.9396 13 0.324219 0 0.324219 0Z"
              fill="#ffffff"
            ></path>
          </svg>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative bg-theme-2">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold">FAQs</h2>
            <p className="mt-2 text-slate-600">Everything you need to know.</p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {FAQS.map(([q, a]) => (
              <details
                key={q}
                className="group rounded-2xl border border-slate-200 bg-white"
              >
                <summary className="cursor-pointer select-none list-none font-medium p-5">
                  {q}
                </summary>
                <p className="text-slate-600 p-5 pt-0">{a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="absolute w-full bottom-[0.1px] z-10 translate-y-full">
          <svg
            width="100%"
            height="27"
            viewBox="0 0 1440 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0.324219 0H1439.68C1259.28 17 676.299 40 323.18 26.5C-29.9396 13 0.324219 0 0.324219 0Z"
              fill="#daf0f2"
            ></path>
          </svg>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10 pt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <a
              href="#home"
              onClick={(e) => goToSection(e, "home")}
              className="font-extrabold tracking-tight text-xl"
            >
              <img
                src="logo.png"
                alt="PartyBliss logo"
                className="h-30 w-auto"
                loading="lazy"
              />
            </a>
          </div>

          <div>
            <div className="font-bold">Contact</div>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>
                <a
                  href="mailto:hello@partybliss.fun"
                  className="hover:text-primary"
                >
                  hello@partybliss.fun
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/60123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  +60 12-345 6789
                </a>
              </li>
              <li>
                <a
                  href="https://waze.com/ul?q=123%20Joy%20Avenue,%20KL"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  123 Joy Avenue, KL
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-bold">Explore</div>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>
                <a
                  href="#packages"
                  onClick={(e) => goToSection(e, "packages")}
                  className="hover:text-primary"
                >
                  Packages
                </a>
              </li>
              <li>
                <a
                  href="#gallery"
                  onClick={(e) => goToSection(e, "gallery")}
                  className="hover:text-primary"
                >
                  Gallery
                </a>
              </li>
              <li>
                <a
                  href="#shop"
                  onClick={(e) => goToSection(e, "shop")}
                  className="hover:text-primary"
                >
                  Shop
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-bold">Follow</div>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>
                <a href="#" className="hover:text-primary">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  TikTok
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-slate-500 py-6 border-t border-slate-200">
          © {new Date().getFullYear()} PartyBliss. All rights reserved.
        </div>
      </footer>

      {/* Back to top */}
      <button
        onClick={() => goToSection("home")}
        className="fixed cursor-pointer z-20 bottom-5 right-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white shadow hover:shadow-md"
        aria-label="Back to top"
      >
        ↑
      </button>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: "Birthday Party Packages",
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode:
              "https://schema.org/OfflineEventAttendanceMode",
            startDate: "2025-12-01",
            location: {
              "@type": "Place",
              name: "PartyBliss Venue",
              address: "123 Joy Avenue, Kuala Lumpur",
            },
            organizer: {
              "@type": "Organization",
              name: "PartyBliss",
              url: "https://example.com",
            },
          }),
        }}
      />
    </div>
  );
}
