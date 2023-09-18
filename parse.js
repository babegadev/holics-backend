// const data = require("./sample_google_routes_response.json");
const data = require("./untar_monas.json");

function parseTransitResponse(data) {
  if (data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    const transitSteps = route.legs[0].steps.filter((step) => step.travelMode === "TRANSIT");

    if (transitSteps.length >= 2) {
      const transit1 = { name: transitSteps[0].transitDetails.stopDetails.departureStop.name, location: transitSteps[0].transitDetails.stopDetails.departureStop.location };
      const transit2 = { name: transitSteps[transitSteps.length - 1].transitDetails.stopDetails.arrivalStop.name, location: transitSteps[transitSteps.length - 1].transitDetails.stopDetails.arrivalStop.location };

      return { transit1, transit2 };
    }
  }

  return null;
}

console.log(parseTransitResponse(data));

console.log("pe")