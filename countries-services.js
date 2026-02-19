const axios = require("axios");
const EventEmitter = require("events");

const countryAPI = new EventEmitter();

// REST Countries /all expects fields= (max 10); keep only what you need
const FIELDS = [
  "name",
  "capital",
  "subregion",
  "region",
  "population",
  "flags",
  "currencies",
  "languages",
];

const API_URL = `https://restcountries.com/v3.1/all?fields=${FIELDS.join(",")}`;

let countriesData = null;
let inFlightPromise = null;

function mapCountry(country) {
  const name = {
    common: country?.name?.common ?? "",
    official: country?.name?.official ?? "",
  };

  const capital = Array.isArray(country?.capital)
    ? country.capital[0] ?? ""
    : country?.capital ?? "";

  const flags = {
    svg: country?.flags?.svg ?? "",
    png: country?.flags?.png ?? "",
  };

  const currencies = country?.currencies
    ? Object.entries(country.currencies).map(([code, info]) => ({
        code,
        name: info?.name ?? "",
        symbol: info?.symbol ?? "",
      }))
    : [];

  const languages = country?.languages
    ? Object.values(country.languages).map((langName) => ({
        name: langName ?? "",
        nativeName: langName ?? "", // REST Countries doesn't provide nativeName like your data.js
      }))
    : [];

  return {
    name,
    capital,
    subregion: country?.subregion ?? "",
    region: country?.region ?? "",
    population: country?.population ?? 0,
    flags,
    currencies,
    languages,
  };
}

function fetchCountries({ refresh = false } = {}) {
  // Keep your old caching behavior
  if (countriesData && !refresh) return Promise.resolve(countriesData);

  // Prevent multiple simultaneous requests
  if (inFlightPromise && !refresh) return inFlightPromise;

  inFlightPromise = axios
    .get(API_URL, {
      headers: { Accept: "application/json" },
      timeout: 15000,
    })
    .then((response) => {
      const raw = response.data;

      const mapped = Array.isArray(raw) ? raw.map(mapCountry) : [];
      countriesData = mapped;

      // Emit the final mapped payload (most useful)
      countryAPI.emit("data", mapped);

      return mapped;
    })
    .catch((err) => {
      countryAPI.emit("error", err);
      throw err;
    })
    .finally(() => {
      inFlightPromise = null;
    });

  return inFlightPromise;
}

// If anywhere you were calling countryAPI.fetchCountries(), keep it working too:
countryAPI.fetchCountries = fetchCountries;

// Optional: keep your error logging centralized
countryAPI.on("error", (err) => {
  console.error("Error fetching countries data:", err?.message || err);
});

module.exports = {
  fetchCountries, // ✅ keeps controller.js working as-is
  countryAPI,     // ✅ lets you keep using events if you want
};
