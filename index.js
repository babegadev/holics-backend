const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

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

// Define a function to fetch transit details from Google Directions API
async function getTransitDetails(origin, destination, timeOfDeparture) {
  const apiKey = process.env.GOOGLE_API_KEY; // Replace with your Google API key
  const apiUrl = "https://routes.googleapis.com/directions/v2:computeRoutes";

  try {
    const response = await axios.post(
      apiUrl,
      {
        origin: {
          address: origin,
        },
        destination: {
          address: destination,
        },
        travelMode: "TRANSIT",
        // departureTime: timeOfDeparture,
        computeAlternativeRoutes: false, // Set to true if you want alternative routes
      },
      {
        params: {
          key: apiKey,
        },
      },
      {
        headers: {
          "X-Goog-FieldMask": "*",
        },
      }
    );

    console.log("Data: ", response.data);

    const transitDetails = parseTransitResponse(response.data);

    if (transitDetails) {
      return {
        origin,
        transit1: transitDetails.transit1,
        transit2: transitDetails.transit2,
        destination,
      };
    } else {
      throw new Error("Unable to fetch transit details");
    }
  } catch (error) {
    throw new Error("Error fetching transit details from Google Directions API");
  }
}

// Function to parse the transit details from the Google Directions API response
function parseTransitResponse(data) {
  if (data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    const transitSteps = route.legs[0].steps.filter((step) => step.travel_mode === "TRANSIT");

    if (transitSteps.length >= 2) {
      const transit1 = transitSteps[0].transit_details.departure_stop.name;
      const transit2 = transitSteps[transitSteps.length - 1].transit_details.arrival_stop.name;

      return { transit1, transit2 };
    }
  }

  return null;
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
