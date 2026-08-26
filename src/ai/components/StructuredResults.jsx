import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllProducts, getPublicCompanies } from "../../api/api";
import { getAiLocale, t } from "../i18n";

const LOCALE_TAGS = { ru: "ru-RU", uz: "uz-UZ", en: "en-US" };
const ENTITY_IMAGE_CATALOG_CACHE = new Map();

function asText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function localizedValue(group, value) {
  const normalized = asText(value).toUpperCase();
  if (!normalized) return "";
  const key = `results.${group}.${normalized}`;
  const translated = t(key);
  return translated === key ? normalized.replaceAll("_", " ").toLowerCase() : translated;
}

function formatNumber(value, options) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return new Intl.NumberFormat(LOCALE_TAGS[getAiLocale()] ?? "ru-RU", options).format(number);
}

function formatMoney(value, currency) {
  const amount = formatNumber(value, { maximumFractionDigits: 2 });
  return amount ? `${amount}${asText(currency) ? ` ${asText(currency)}` : ""}` : "";
}

function formatRange(min, max, currency) {
  const first = formatMoney(min, currency);
  const last = formatMoney(max, currency);
  if (first && last && first !== last) return `${first} – ${last}`;
  return first || last;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return asText(value);
  return new Intl.DateTimeFormat(LOCALE_TAGS[getAiLocale()] ?? "ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return asText(value);
  return new Intl.DateTimeFormat(LOCALE_TAGS[getAiLocale()] ?? "ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function countValue(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function percent(value, scale) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const normalized = scale === "fraction" ? number * 100 : number;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function safeWebsite(value) {
  const raw = asText(value);
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function safePhone(value) {
  const label = asText(value);
  if (!label) return null;
  const href = label.replace(/[^+\d]/g, "");
  return href.length >= 5 ? { label, href: `tel:${href}` } : null;
}

function Badge({ children, tone = "neutral" }) {
  const classes =
    tone === "brand"
      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
      : tone === "success"
        ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
        : "bg-ink-50 text-ink-500 dark:bg-[#171717] dark:text-ink-400";
  return <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${classes}`}>{children}</span>;
}

function Score({ value, scale = "fraction" }) {
  const score = percent(value, scale);
  if (score === null) return null;
  return (
    <span
      aria-label={t("results.scoreLabel", { score })}
      className="shrink-0 rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
    >
      {score}%
    </span>
  );
}

function Reasons({ reasons }) {
  if (!Array.isArray(reasons) || reasons.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5" aria-label={t("results.reasonsLabel")}>
      {reasons.slice(0, 6).map((reason, index) => (
        <Badge key={`${reason}-${index}`}>{localizedValue("reason", reason)}</Badge>
      ))}
    </div>
  );
}

function ContactStatusMessage({ status }) {
  const normalized = asText(status).toUpperCase();
  const keys = {
    NO_PUBLIC_FIELDS: "results.contactStatus.noPublicFields",
    NOT_FOUND: "results.contactStatus.notFound",
    TEMPORARILY_UNAVAILABLE: "results.contactStatus.temporarilyUnavailable",
    NOT_CHECKED: "results.contactStatus.notChecked",
  };
  return (
    <p className="mt-3 text-xs text-ink-400">
      {t(keys[normalized] ?? "results.contactStatus.unknown")}
    </p>
  );
}

function PublicContact({ contact, status }) {
  const normalizedStatus = asText(status).toUpperCase();
  if (normalizedStatus !== "AVAILABLE") {
    return <ContactStatusMessage status={normalizedStatus} />;
  }
  if (!contact || typeof contact !== "object") {
    return <p className="mt-3 text-xs text-ink-400">{t("results.contactStatus.availableButHidden")}</p>;
  }
  const phones = [safePhone(contact.phonePrimary), safePhone(contact.phoneSecondary)].filter(Boolean);
  const website = safeWebsite(contact.website);
  const address = asText(contact.address);
  if (phones.length === 0 && !website && !address) {
    return <p className="mt-3 text-xs text-ink-400">{t("results.contactStatus.availableButHidden")}</p>;
  }
  return (
    <address className="mt-3 not-italic border-t border-ink-100 pt-3 text-xs dark:border-[#242424]">
      <p className="mb-1 font-semibold text-ink-600 dark:text-ink-300">
        {t("results.publicContact")}
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-brand-600 dark:text-brand-400">
        {phones.map((phone) => (
          <a key={phone.href} href={phone.href} className="underline underline-offset-2">
            {phone.label}
          </a>
        ))}
        {website && (
          <a href={website} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {t("results.website")}
          </a>
        )}
        {address && <span className="w-full text-ink-500 dark:text-ink-400">{address}</span>}
      </div>
    </address>
  );
}

function InternalTitle({ item, type }) {
  const name = asText(item.name) || t(type === "PRODUCT" ? "results.unnamedProduct" : "results.unnamedCompany");
  return (
    <h4 className="font-semibold text-ink-900 transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
      {name}
    </h4>
  );
}

function productImage(images) {
  if (!Array.isArray(images) || images.length === 0) return "";
  const image = images.find((entry) => entry?.is_primary || entry?.isPrimary) ?? images[0];
  const thumbnails = image?.thumbnail_urls ?? image?.thumbnailUrls;
  if (thumbnails && typeof thumbnails === "object") {
    const preferred = thumbnails.medium ?? thumbnails.md ?? thumbnails.small ?? thumbnails.sm
      ?? thumbnails.large ?? thumbnails.lg ?? Object.values(thumbnails).find(Boolean);
    if (preferred) return asText(preferred);
  }
  return asText(image?.url);
}

function embeddedEntityImage(item, type) {
  if (type === "COMPANY") {
    return asText(item.logoUrl ?? item.logoURL ?? item.imageUrl ?? item.thumbnailUrl);
  }
  return asText(item.thumbnailUrl ?? item.imageUrl) || productImage(item.images);
}

function catalogImageMap(type) {
  if (ENTITY_IMAGE_CATALOG_CACHE.has(type)) return ENTITY_IMAGE_CATALOG_CACHE.get(type);

  const request = (type === "PRODUCT"
    ? getAllProducts({ page: 1, perPage: 200 }).then((page) => ({
        rows: page?.items ?? page?.content ?? [],
        image: (row) => asText(row?.thumbnailUrl ?? row?.imageUrl) || productImage(row?.images),
      }))
    : getPublicCompanies({ page: 1, per_page: 100 }).then((page) => ({
        rows: page?.content ?? page?.items ?? [],
        image: (row) => asText(row?.logoUrl ?? row?.imageUrl),
      })))
    .then(({ rows, image }) => {
      const images = new Map();
      for (const row of Array.isArray(rows) ? rows : []) {
        const source = image(row);
        if (!source) continue;
        const slug = asText(row?.slug);
        const id = asText(row?.id ?? row?.productId ?? row?.companyId);
        if (slug) images.set(`slug:${slug}`, source);
        if (id) images.set(`id:${id}`, source);
      }
      return images;
    })
    .catch(() => {
      ENTITY_IMAGE_CATALOG_CACHE.delete(type);
      return new Map();
    });

  ENTITY_IMAGE_CATALOG_CACHE.set(type, request);
  return request;
}

function loadEntityImage(item, type) {
  const slug = asText(item.slug);
  const id = asText(item.id ?? item.productId ?? item.companyId);
  if (!slug && !id) return Promise.resolve("");
  return catalogImageMap(type).then((images) =>
    (slug ? images.get(`slug:${slug}`) : "") || (id ? images.get(`id:${id}`) : "") || ""
  );
}

function EntityThumbnail({ item, type, name }) {
  const slug = asText(item.slug);
  const embedded = embeddedEntityImage(item, type);
  const entityKey = `${type}:${slug}`;
  const [resolved, setResolved] = useState({ key: null, source: "" });
  const [failedSource, setFailedSource] = useState("");
  const hydrated = resolved.key === entityKey ? resolved.source : "";
  const source = embedded || hydrated;
  const failed = Boolean(source && failedSource === source);

  useEffect(() => {
    let active = true;
    if (!embedded && slug) {
      loadEntityImage(item, type).then((image) => {
        if (active && image) setResolved({ key: entityKey, source: image });
      });
    }
    return () => {
      active = false;
    };
  }, [embedded, entityKey, item, slug, type]);

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-100 bg-gradient-to-br from-brand-50 to-ink-50 text-xl font-bold text-brand-600 dark:border-[#242424] dark:from-brand-500/10 dark:to-[#171717] dark:text-brand-300">
      {source && !failed ? (
        <img
          src={source}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailedSource(source)}
        />
      ) : (
        <span aria-hidden="true">{name.slice(0, 1).toLocaleUpperCase() || "AI"}</span>
      )}
    </div>
  );
}

function resultPath(item, type) {
  const slug = asText(item.slug);
  if (!slug) return null;
  return `${type === "PRODUCT" ? "/product/" : "/company/"}${encodeURIComponent(slug)}`;
}

function BusinessCard({ item, supplier = false, indexFreshness }) {
  const type = supplier ? "COMPANY" : asText(item.type).toUpperCase();
  const price = type === "PRODUCT" ? formatMoney(item.price, item.currency) : formatRange(item.minPrice, item.maxPrice);
  const indexedAsVerified = asText(item.verificationStatus).toUpperCase() === "VERIFIED";
  const historicalVerification = indexFreshness?.stale !== false;
  const path = resultPath(item, type);
  const name = asText(item.name) || t(type === "PRODUCT" ? "results.unnamedProduct" : "results.unnamedCompany");
  const content = (
    <div className="flex items-start gap-3">
      <EntityThumbnail item={item} type={type} name={name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <Badge tone="brand">{t(type === "PRODUCT" ? "results.product" : "results.company")}</Badge>
              {indexedAsVerified && (
                <Badge tone={historicalVerification ? "neutral" : "success"}>
                  {t(historicalVerification ? "results.verifiedAtSnapshot" : "results.indexedVerified")}
                </Badge>
              )}
            </div>
            <InternalTitle item={item} type={type} />
          </div>
          <Score value={item.relevance ?? item.matchScore ?? item.score} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
          {price && <span>{t(type === "PRODUCT" ? "results.price" : "results.priceRange")}: {price}</span>}
          {Number.isFinite(Number(item.productCount)) && (
            <span>{t("results.productCount", { count: Number(item.productCount) })}</span>
          )}
        </div>
        <Reasons reasons={item.reasons} />
        {path && (
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
            {t(type === "PRODUCT" ? "results.openProduct" : "results.openCompany")}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        )}
      </div>
    </div>
  );

  return (
    <article className="overflow-hidden rounded-xl border border-ink-100 bg-white transition-all hover:border-brand-200 hover:shadow-md dark:border-[#242424] dark:bg-[#111111] dark:hover:border-brand-500/30">
      {path ? (
        <Link
          to={path}
          aria-label={name}
          className="group block p-3.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
        >
          {content}
        </Link>
      ) : (
        <div className="p-3.5">{content}</div>
      )}
      {type === "COMPANY" && (
        <div className="px-3.5 pb-3.5">
          <PublicContact contact={item.contact} status={item.contactStatus} />
        </div>
      )}
    </article>
  );
}

function BuyerOpportunityCard({ item }) {
  const leadId = asText(item.leadId);
  const products = Array.isArray(item.requestedItems) ? item.requestedItems.slice(0, 10) : [];
  return (
    <article className="rounded-xl border border-ink-100 bg-white p-3.5 dark:border-[#242424] dark:bg-[#111111]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone="brand">{t("results.sellerOwnedLead")}</Badge>
          <h4 className="mt-1.5 font-semibold text-ink-900 dark:text-white">
            {t("results.buyerRequest", { id: leadId || "—" })}
          </h4>
        </div>
        <Score value={item.matchScore} scale="percent" />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
        {item.status && <span>{t("results.statusLabel")}: {localizedValue("status", item.status)}</span>}
        {item.neededDate && <span>{t("results.neededBy")}: {formatDate(item.neededDate)}</span>}
      </div>
      {products.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-ink-700 dark:text-ink-200">
          {products.map((product, index) => (
            <li key={`${product.productId ?? product.productName}-${index}`}>
              {asText(product.productName) || t("results.unnamedProduct")}
              {product.quantity ? ` × ${formatNumber(product.quantity)}` : ""}
            </li>
          ))}
        </ul>
      )}
      <Reasons reasons={item.reasons} />
      <Link
        to="/seller?tab=requests"
        className="mt-3 inline-flex rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-300 dark:hover:bg-brand-500/10"
      >
        {t("results.openSellerRequests")}
      </Link>
    </article>
  );
}

function sellerVisibleDraftFields(item) {
  const missing = t("results.notProvided");
  return [
    [t("results.category"), asText(item.category) || missing],
    [t("results.region"), asText(item.region) || missing],
    [t("results.needText"), asText(item.need ?? item.needText) || missing],
    [t("results.quantity"), formatMoney(item.quantity, item.quantityUnit) || missing],
    [t("results.budget"), formatRange(item.budgetMin, item.budgetMax, item.currency) || missing],
    [t("results.expires"), formatDate(item.expiresAt) || missing],
  ];
}

function publicationConfirmation(item, backendPublicationDisclosure) {
  const fields = sellerVisibleDraftFields(item)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
  return [
    t("results.publishConfirm"),
    t("results.publicationDisclosureFallback"),
    asText(backendPublicationDisclosure)
      ? `${t("results.backendDisclosureLabel")}: ${asText(backendPublicationDisclosure)}`
      : "",
    `${t("results.sellerVisibleTitle")}\n${fields}`,
  ].filter(Boolean).join("\n\n");
}

function IntentCard({ item, match = false, onPublish, onClose, publicationDisclosure }) {
  const intentId = asText(item.intentId ?? item.id);
  const status = asText(item.status).toUpperCase();
  const budget = formatRange(item.budgetMin, item.budgetMax, item.currency);
  const quantity = formatMoney(item.quantity, item.quantityUnit);
  const mayPublish = Boolean(onPublish) && status === "DRAFT";
  const mayClose =
    Boolean(onClose) &&
    (status === "PUBLISHED" ||
      (status === "CONFIRMATION_REQUIRED" && item.confirmationRequired === true));
  const backendDisclosure = asText(item.publicationDisclosure ?? publicationDisclosure);
  const visibleFields = mayPublish ? sellerVisibleDraftFields(item) : [];
  return (
    <article className="rounded-xl border border-ink-100 bg-white p-3.5 dark:border-[#242424] dark:bg-[#111111]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <Badge tone="brand">{t(match ? "results.anonymousNeed" : "results.yourBuyingIntent")}</Badge>
            {status && <Badge tone={status === "PUBLISHED" ? "success" : "neutral"}>{localizedValue("status", status)}</Badge>}
          </div>
          <h4 className="font-semibold text-ink-900 dark:text-white">
            {asText(item.category) || t("results.buyingNeed")}
          </h4>
        </div>
        {match && <Score value={item.matchScore} scale="percent" />}
      </div>
      {asText(item.need ?? item.needText) && (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-700 dark:text-ink-200">
          {asText(item.need ?? item.needText)}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
        {item.region && <span>{t("results.region")}: {asText(item.region)}</span>}
        {quantity && <span>{t("results.quantity")}: {quantity}</span>}
        {budget && <span>{t("results.budget")}: {budget}</span>}
        {item.expiresAt && <span>{t("results.expires")}: {formatDate(item.expiresAt)}</span>}
      </div>
      <Reasons reasons={item.reasons} />
      {mayPublish && (
        <div
          role="note"
          className="mt-3 rounded-lg border border-warning-400/30 bg-warning-50 p-3 text-xs text-ink-600 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-ink-300"
        >
          <p className="font-semibold text-ink-800 dark:text-ink-100">
            {t("results.sellerVisibleTitle")}
          </p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
            {visibleFields.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-medium">{label}:</dt>
                <dd className="min-w-0 break-words">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 border-t border-warning-400/20 pt-2">
            {t("results.publicationDisclosureFallback")}
          </p>
          {backendDisclosure && (
            <p className="mt-1 break-words">
              <span className="font-medium">{t("results.backendDisclosureLabel")}:</span>{" "}
              {backendDisclosure}
            </p>
          )}
        </div>
      )}
      {(mayPublish || mayClose) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {mayPublish && (
            <button
              type="button"
              disabled={item.actionPending}
              onClick={() =>
                window.confirm(publicationConfirmation(item, backendDisclosure)) && onPublish(intentId)
              }
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {item.actionPending ? t("results.publishing") : t("results.publish")}
            </button>
          )}
          {mayClose && (
            <button
              type="button"
              disabled={item.actionPending}
              onClick={() => window.confirm(t("results.closeConfirm")) && onClose(intentId)}
              className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#2A2A2A] dark:text-ink-200 dark:hover:bg-[#171717]"
            >
              {item.actionPending ? t("results.closing") : t("results.close")}
            </button>
          )}
        </div>
      )}
      {item.actionError && <p role="alert" className="mt-2 text-xs text-danger-600">{t("results.actionError")}</p>}
    </article>
  );
}

function titleFor(kind) {
  const key = `results.title.${kind}`;
  const value = t(key);
  return value === key ? t("results.title.unknown") : value;
}

function ResultMetadata({ resultSet, business, buyer, intentMatch, ownIntents }) {
  const freshness = business && resultSet.indexFreshness && typeof resultSet.indexFreshness === "object"
    ? resultSet.indexFreshness
    : null;
  const asOf = formatDateTime(freshness?.asOf ?? resultSet.asOf);
  const evaluated = countValue(
    buyer ? resultSet.evaluatedLeadCount : intentMatch ? resultSet.evaluatedIntentCount : null
  );
  const total = countValue(
    buyer ? resultSet.totalLeadCount : intentMatch ? resultSet.totalIntentCount : null
  );
  const hasCandidateCounts = evaluated !== null || total !== null;
  const hasTruncationState = typeof resultSet.candidatesTruncated === "boolean";
  const ownerTotal = ownIntents ? countValue(resultSet.total) : null;
  const ownerPage = ownIntents ? countValue(resultSet.page) : null;
  const ownerTotalPages = ownIntents ? countValue(resultSet.totalPages) : null;
  const hasOwnerPagination = ownerTotal !== null || ownerPage !== null || ownerTotalPages !== null;
  if (!freshness && !asOf && !hasCandidateCounts && !hasTruncationState && !hasOwnerPagination) {
    return null;
  }

  return (
    <div className="mb-3 space-y-1 rounded-lg border border-ink-100 bg-white px-3 py-2 text-[11px] leading-relaxed text-ink-500 dark:border-[#242424] dark:bg-[#111111] dark:text-ink-400">
      {freshness && (
        <>
          <p>
            {asOf
              ? t("results.indexSnapshot", { date: asOf })
              : t("results.indexSnapshotUnknown")}
          </p>
          <p className={freshness.stale ? "text-warning-600 dark:text-warning-400" : ""}>
            {t(freshness.stale ? "results.indexStale" : "results.indexWithinWindow")}
          </p>
        </>
      )}
      {!freshness && asOf && <p>{t("results.dataAsOf", { date: asOf })}</p>}
      {hasCandidateCounts && (
        <p>
          {evaluated !== null && total !== null
            ? t("results.evaluatedOfTotal", { evaluated, total })
            : evaluated !== null
              ? t("results.evaluatedCount", { evaluated })
              : t("results.totalCandidates", { total })}
        </p>
      )}
      {hasTruncationState && (
        <p className={resultSet.candidatesTruncated ? "text-warning-600 dark:text-warning-400" : ""}>
          {t(resultSet.candidatesTruncated ? "results.candidatesTruncated" : "results.candidateScanComplete")}
        </p>
      )}
      {hasOwnerPagination && (
        <>
          {ownerTotal !== null && (
            <p>{t("results.displayingOfTotal", { displayed: resultSet.items.length, total: ownerTotal })}</p>
          )}
          {ownerPage !== null && ownerTotalPages !== null && (
            <p>{t("results.pageOfTotal", { page: ownerPage, totalPages: ownerTotalPages })}</p>
          )}
        </>
      )}
    </div>
  );
}

function ResultSet({ resultSet, index, onPublishIntent, onCloseIntent }) {
  const { kind, items = [] } = resultSet;
  const isSupplier = kind === "supplier_recommendations";
  const isBuyer = kind === "buyer_recommendations";
  const isIntentMatch = kind === "buying_intent_matches";
  const isIntent = kind === "buying_intents" || kind === "buying_intent_draft" || kind === "buying_intent_status";
  const isBusiness = kind === "business_search" || isSupplier;
  const invalid = resultSet.invalid || (!isBusiness && !isBuyer && !isIntentMatch && !isIntent);

  return (
    <section aria-label={titleFor(kind)} className="mt-3 rounded-2xl bg-ink-50/80 p-3 dark:bg-[#0A0A0A]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{titleFor(kind)}</h3>
        {!invalid && <span className="text-xs text-ink-400">{t("results.found", { count: items.length })}</span>}
      </div>
      {!invalid && (
        <ResultMetadata
          resultSet={resultSet}
          business={isBusiness}
          buyer={isBuyer}
          intentMatch={isIntentMatch}
          ownIntents={kind === "buying_intents"}
        />
      )}
      {invalid ? (
        <p role="status" className="rounded-xl border border-warning-400/30 bg-warning-50 p-3 text-xs text-warning-600 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400">
          {t("results.unavailable")}
        </p>
      ) : items.length === 0 ? (
        <p role="status" className="rounded-xl border border-ink-100 bg-white p-3 text-xs text-ink-500 dark:border-[#242424] dark:bg-[#111111] dark:text-ink-400">
          {t("results.empty")}
        </p>
      ) : (
        <div role="list" className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {items.map((item, itemIndex) => (
            <div role="listitem" key={`${item.id ?? item.companyId ?? item.leadId ?? item.intentId ?? "result"}-${itemIndex}`}>
              {isBusiness && (
                <BusinessCard
                  item={item}
                  supplier={isSupplier}
                  indexFreshness={resultSet.indexFreshness}
                />
              )}
              {isBuyer && <BuyerOpportunityCard item={item} />}
              {(isIntentMatch || isIntent) && (
                <IntentCard
                  item={item}
                  match={isIntentMatch}
                  onPublish={isIntent ? (intentId) => onPublishIntent?.(index, intentId) : undefined}
                  onClose={isIntent ? (intentId) => onCloseIntent?.(index, intentId) : undefined}
                  publicationDisclosure={resultSet.publicationDisclosure}
                />
              )}
            </div>
          ))}
        </div>
      )}
      {!invalid && (
        <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-ink-400 dark:text-ink-500">
          {(isBusiness || isSupplier || isBuyer || isIntentMatch) && <p>{t("results.scoreDisclaimer")}</p>}
          {isSupplier && <p>{t("results.supplierDisclaimer")}</p>}
          {isBuyer && <p>{t("results.sellerPrivacy")}</p>}
          {isIntentMatch && <p>{t("results.intentPrivacy")}</p>}
          {isIntent && <p>{t("results.ownIntentPrivacy")}</p>}
          {(isBuyer || isIntentMatch || isIntent) && <p>{t("results.noAutomaticOutreach")}</p>}
        </div>
      )}
    </section>
  );
}

export default function StructuredResults({ resultSets, onPublishIntent, onCloseIntent }) {
  if (!Array.isArray(resultSets) || resultSets.length === 0) return null;
  return (
    <div className="space-y-3">
      {resultSets.map((resultSet, index) => (
        <ResultSet
          key={`${resultSet.kind}-${index}`}
          resultSet={resultSet}
          index={index}
          onPublishIntent={onPublishIntent}
          onCloseIntent={onCloseIntent}
        />
      ))}
    </div>
  );
}
