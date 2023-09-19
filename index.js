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
  const apiKey = AIzaSyBXM9gw073RGxzJ8g5dOKeSBHg5lT7lRTs; // Replace with your Google API key
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
// Modify the parseTransitResponse function to extract distanceMeters from steps
function parseTransitResponse(data) {
  if (data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    const allSteps = route.legs[0].steps;
    const transitSteps = route.legs[0].steps.filter((step) => step.travelMode === "TRANSIT");

    if (transitSteps.length >= 2) {
      const transit1 = { name: transitSteps[0].transitDetails.stopDetails.departureStop.name, location: transitSteps[0].transitDetails.stopDetails.departureStop.location };
      const transit2 = { name: transitSteps[transitSteps.length - 1].transitDetails.stopDetails.arrivalStop.name, location: transitSteps[transitSteps.length - 1].transitDetails.stopDetails.arrivalStop.location };

      // Extract distanceMeters from WALK steps before TRANSIT steps
      let i = 0;
      let firstMileDistance = 0; // Initialize a variable to store the sum
      while (i < allSteps.length && allSteps[i].travelMode === "WALK") {
        firstMileDistance += allSteps[i].distanceMeters; // Add the distance to the sum
        i++;
      }

// Now, firstMileDistanceSum contains the sum of the distances

      let k = allSteps.length - 1;
      let lastMileDistance = 0;
      while (k >= 0 && allSteps[k].travelMode === "WALK") {
        lastMileDistance += allSteps[k].distanceMeters;
        k--;
      }


      return { transit1, transit2, firstMileDistance, lastMileDistance}; // Include walkDistances in the return object
    }
  }

  return null;
}


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
