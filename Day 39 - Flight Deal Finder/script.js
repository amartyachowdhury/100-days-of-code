const SERPAPI_ENDPOINT = "https://serpapi.com/search";
const SEARCH_DAYS_AHEAD = 180;

const searchForm = document.getElementById("searchForm");
const originIataInput = document.getElementById("originIata");
const serpApiKeyInput = document.getElementById("serpApiKey");
const sheetyEndpointInput = document.getElementById("sheetyEndpoint");
const sheetyUsernameInput = document.getElementById("sheetyUsername");
const sheetyPasswordInput = document.getElementById("sheetyPassword");
const statusElement = document.getElementById("status");
const resultsElement = document.getElementById("results");
const resultsTableElement = document.getElementById("resultsTable");
const alertsElement = document.getElementById("alerts");
const alertListElement = document.getElementById("alertList");

function searchWindow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + SEARCH_DAYS_AHEAD);
  return {
    outboundDate: tomorrow.toISOString().split("T")[0],
    returnDate: endDate.toISOString().split("T")[0],
  };
}

function findCheapestFlight(data, returnDate) {
  if (!data || (!data.best_flights?.length && !data.other_flights?.length)) {
    return null;
  }

  const allFlights = [...(data.best_flights || []), ...(data.other_flights || [])];
  let cheapest = null;

  for (const flight of allFlights) {
    if (typeof flight.price !== "number") {
      continue;
    }

    const origin = flight.flights[0].departure_airport.id;
    const destination = flight.flights.at(-1).arrival_airport.id;
    const outDate = flight.flights[0].departure_airport.time.split(" ")[0];

    if (!cheapest || flight.price < cheapest.price) {
      cheapest = {
        price: flight.price,
        originAirport: origin,
        destinationAirport: destination,
        outDate,
        returnDate,
      };
    }
  }

  return cheapest;
}

function buildAlertMessage(flight) {
  return (
    `Low price alert! Only GBP ${flight.price} to fly ` +
    `from ${flight.originAirport} to ${flight.destinationAirport}, ` +
    `on ${flight.outDate} until ${flight.returnDate}.`
  );
}

function addResultRow(destination, cheapestFlight, isDeal) {
  const row = document.createElement("div");
  row.className = `result-row${isDeal ? " deal" : ""}`;
  row.innerHTML = `
    <span>${destination.city}</span>
    <span>${cheapestFlight ? `GBP ${cheapestFlight.price}` : "N/A"}</span>
    <span>Target GBP ${destination.lowestPrice}</span>
    <span>${isDeal ? "Deal found" : "No alert"}</span>
  `;
  resultsTableElement.append(row);
}

function addAlert(message) {
  const item = document.createElement("div");
  item.className = "alert-item";
  item.textContent = message;
  alertListElement.append(item);
}

async function loadDestinations() {
  const endpoint = sheetyEndpointInput.value.trim();
  const username = sheetyUsernameInput.value.trim();
  const password = sheetyPasswordInput.value.trim();

  if (!endpoint || !username || !password) {
    return sampleDestinations;
  }

  const credentials = btoa(`${username}:${password}`);
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    throw new Error("Could not load destinations from Sheety.");
  }

  const payload = await response.json();
  return payload.prices;
}

async function checkFlights(origin, destinationCode, serpApiKey, dates) {
  const url = new URL(SERPAPI_ENDPOINT);
  url.searchParams.set("engine", "google_flights");
  url.searchParams.set("departure_id", origin);
  url.searchParams.set("arrival_id", destinationCode);
  url.searchParams.set("outbound_date", dates.outboundDate);
  url.searchParams.set("return_date", dates.returnDate);
  url.searchParams.set("type", "1");
  url.searchParams.set("adults", "1");
  url.searchParams.set("currency", "GBP");
  url.searchParams.set("api_key", serpApiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Flight search request failed.");
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload;
}

async function searchDeals(event) {
  event.preventDefault();
  statusElement.textContent = "Searching flight deals...";
  resultsElement.hidden = true;
  alertsElement.hidden = true;
  resultsTableElement.innerHTML = "";
  alertListElement.innerHTML = "";

  const origin = originIataInput.value.trim().toUpperCase();
  const serpApiKey = serpApiKeyInput.value.trim();

  if (!origin || origin.length !== 3) {
    statusElement.textContent = "Please enter a valid 3-letter origin airport code.";
    return;
  }

  if (!serpApiKey) {
    statusElement.textContent = "Please enter your SerpAPI key.";
    return;
  }

  const header = document.createElement("div");
  header.className = "result-row header";
  header.innerHTML = `
    <span>Destination</span>
    <span>Best Price</span>
    <span>Threshold</span>
    <span>Status</span>
  `;
  resultsTableElement.append(header);

  try {
    const destinations = await loadDestinations();
    const dates = searchWindow();
    let dealsFound = 0;

    for (const destination of destinations) {
      statusElement.textContent = `Searching flights to ${destination.city}...`;

      try {
        const flightData = await checkFlights(
          origin,
          destination.iataCode,
          serpApiKey,
          dates,
        );
        const cheapestFlight = findCheapestFlight(flightData, dates.returnDate);
        const isDeal =
          cheapestFlight && cheapestFlight.price < destination.lowestPrice;

        addResultRow(destination, cheapestFlight, isDeal);

        if (isDeal) {
          dealsFound += 1;
          addAlert(buildAlertMessage(cheapestFlight));
        }
      } catch {
        addResultRow(destination, null, false);
      }
    }

    resultsElement.hidden = false;
    alertsElement.hidden = dealsFound === 0;
    statusElement.textContent = dealsFound
      ? `Found ${dealsFound} deal${dealsFound === 1 ? "" : "s"} below your saved thresholds.`
      : "Search complete. No deals below your saved thresholds right now.";
  } catch (error) {
    statusElement.textContent =
      error.message || "Could not complete the flight search. Check your API keys and try again.";
  }
}

searchForm.addEventListener("submit", searchDeals);
