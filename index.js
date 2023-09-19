const express = require("express");
const axios = require("axios");
require("dotenv").config();

const parseTransitResponse = require("./parse");

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

async function getTransitDetails(origin, destination, timeOfDeparture) {
  const apiKey = AIzaSyBXM9gw073RGxzJ8g5dOKeSBHg5lT7lRTs; // Replace with your Google API key
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

  axios
    .request(config)
    .then((response) => {
      const transitDetails = parseTransitResponse(response.data);
      console.log(transitDetails);
      // console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
