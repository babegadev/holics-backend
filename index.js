const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3030;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Define your API endpoint for getting transit details
app.post("/getTransitDetails", async (req, res) => {
  try {
    const { origin, destination, timeOfDeparture } = req.body;

    // Use the Google Directions API endpoint to fetch transit details
    const transitDetails = await getTransitDetails(origin, destination, timeOfDeparture);

    res.json(transitDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function extractTransitStops(steps) {
  const transitSteps = steps.filter((step) => step.travelMode === "TRANSIT");
  if (transitSteps.length >= 2) {
    const transit1 = {
      name: transitSteps[0].transitDetails.stopDetails.departureStop.name,
      location: transitSteps[0].transitDetails.stopDetails.departureStop.location,
    };
    const transit2 = {
      name: transitSteps[transitSteps.length - 1].transitDetails.stopDetails.arrivalStop.name,
      location: transitSteps[transitSteps.length - 1].transitDetails.stopDetails.arrivalStop.location,
    };
    return { transit1, transit2 };
  }
  return null;
}

function calculateMileageAndDuration(steps) {
  let i = 0;
  let firstMileDistance = 0;
  let sumFirstMileDuration = 0;
  let k = steps.length - 1;
  let lastMileDistance = 0;
  let sumLastMileDuration = 0;

  while (i < steps.length && steps[i].travelMode === "WALK") {
    firstMileDistance += steps[i].distanceMeters;
    sumFirstMileDuration += parseInt(steps[i].localizedValues.staticDuration.text) || 0;
    i++;
  }

  while (k >= 0 && steps[k].travelMode === "WALK") {
    lastMileDistance += steps[k].distanceMeters;
    sumLastMileDuration += parseInt(steps[k].localizedValues.staticDuration.text) || 0;
    k--;
  }

  return {
    firstMileDistance,
    lastMileDistance,
    firstMileDuration: sumFirstMileDuration,
    lastMileDuration: sumLastMileDuration,
  };
}

function calculatePrices(firstMileDistance, firstMileDuration, lastMileDistance, lastMileDuration) {
  const firstMilePrice = 3 + 0.275 * firstMileDuration + 3 * (firstMileDistance * 0.00062137) + 1.75;
  const lastMilePrice = 3 + 0.275 * lastMileDuration + 3 * (lastMileDistance * 0.00062137) + 1.75;
  return {
    firstMilePrice: firstMilePrice.toFixed(2),
    lastMilePrice: lastMilePrice.toFixed(2),
  };
}

function parseTransitResponse(data) {
  if (data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    console.log(route.travelAdvisory.transitFare.units);
    const { transit1, transit2 } = extractTransitStops(route.legs[0].steps);
    const { firstMileDistance, lastMileDistance, firstMileDuration, lastMileDuration } = calculateMileageAndDuration(route.legs[0].steps);
    const { firstMilePrice, lastMilePrice } = calculatePrices(firstMileDistance, firstMileDuration, lastMileDistance, lastMileDuration);
    const transitPrice = route.travelAdvisory.transitFare.units || 0;

    return {
      transit1,
      transit2,
      firstMileDistance,
      lastMileDistance,
      firstMileDuration,
      lastMileDuration,
      firstMilePrice,
      lastMilePrice,
      transitPrice,
    };
  }
  return null;
}

async function getTransitDetails(origin, destination, timeOfDeparture) {
  const apiKey = process.env.GOOGLE_API_KEY; // Replace with your Google API key
  const apiUrl = "https://routes.googleapis.com/directions/v2:computeRoutes?key=" + apiKey;

  let data = JSON.stringify({
    origin: {
      address: origin,
    },
    destination: {
      address: destination,
    },
    travelMode: "TRANSIT",
    computeAlternativeRoutes: false,
    units: "METRIC",
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: apiUrl,
    headers: {
      "X-Goog-FieldMask": "*",
      "Content-Type": "application/json",
    },
    data: data,
  };

  return axios
    .request(config)
    .then(async (response) => {
      const transitDetails = await parseTransitResponse(response.data);
      return transitDetails;
      // console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
