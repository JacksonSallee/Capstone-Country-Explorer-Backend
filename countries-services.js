const https = require("https");

// REST Countries now expects you to specify fields for the /all endpoint (max 10).
// We only request what we need to match data.js as closely as possible.
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

let countriesData;

function mapCountry(country) {
  const name = {
    common: country?.name?.common ?? "",
    official: country?.name?.official ?? "",
  };

  // REST Countries returns capital as an array (or sometimes missing)
  const capital = Array.isArray(country?.capital)
    ? country.capital[0] ?? ""
    : country?.capital ?? "";

  const flags = {
    svg: country?.flags?.svg ?? "",
    png: country?.flags?.png ?? "",
  };

  // v3.1 currencies is an object keyed by currency code
  const currencies = country?.currencies
    ? Object.entries(country.currencies).map(([code, info]) => ({
        code,
        name: info?.name ?? "",
        symbol: info?.symbol ?? "",
      }))
    : [];

  // v3.1 languages is an object keyed by language code
  // Native language names like your data.js uses generally aren't provided,
  // so we mirror `name` into `nativeName`.
  const languages = country?.languages
    ? Object.values(country.languages).map((langName) => ({
        name: langName ?? "",
        nativeName: langName ?? "",
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
  if (countriesData && !refresh) return Promise.resolve(countriesData);

  return new Promise((resolve, reject) => {
    const req = https.get(
      API_URL,
      { headers: { Accept: "application/json" } },
      (res) => {
        let raw = "";

        res.on("data", (chunk) => {
          raw += chunk;
        });

        res.on("end", () => {
          // Handle non-2xx responses (helpful when fields are missing/invalid)
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(
              new Error(
                `REST Countries request failed: ${res.statusCode} ${res.statusMessage} - ${raw.slice(
                  0,
                  200
                )}`
              )
            );
          }

          try {
            const parsed = JSON.parse(raw);
            countriesData = Array.isArray(parsed)
              ? parsed.map(mapCountry)
              : [];
            resolve(countriesData);
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
  });
}

module.exports = {
  fetchCountries,
};
