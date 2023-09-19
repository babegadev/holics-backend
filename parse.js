// const data = require("./sample_google_routes_response.json");
const data = require("./untar_monas.json");

function parseTransitResponse(data) {
  if (data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    const transitSteps = route.legs[0].steps.filter((step) => step.travelMode === "TRANSIT");
    const allSteps = route.legs[0].steps;

    if (transitSteps.length >= 2) {
      const transit1 = { name: transitSteps[0].transitDetails.stopDetails.departureStop.name, location: transitSteps[0].transitDetails.stopDetails.departureStop.location };
      const transit2 = { name: transitSteps[transitSteps.length - 1].transitDetails.stopDetails.arrivalStop.name, location: transitSteps[transitSteps.length - 1].transitDetails.stopDetails.arrivalStop.location };

      let i = 0;
      let firstMileDistance = 0; // Initialize a variable to store the sum
      while (i < allSteps.length && allSteps[i].travelMode === "WALK") {
        firstMileDistance += allSteps[i].distanceMeters; // Add the distance to the sum
        i++;
      }

      let k = allSteps.length - 1;
      let lastMileDistance = 0;
      while (k >= 0 && allSteps[k].travelMode === "WALK") {
        lastMileDistance += allSteps[k].distanceMeters;
        k--;
      }

      let firstMileDuration = [];
      for (let l = 0; l < allSteps.length; l++) {
        if (allSteps[l].travelMode === "WALK") {
          firstMileDuration.push(parseInt(allSteps[l].localizedValues.staticDuration.text)); // Convert duration to int and push to the array
        } else {
          // Stop when encountering the last "TRANSIT" step
          break;
        }
      }

      let lastMileDuration = [];
      for (let m = allSteps.length-1; m >= 0; m--) {
        if (allSteps[m].travelMode === "WALK") {
          lastMileDuration.push(parseInt(allSteps[m].localizedValues.staticDuration.text)); // Convert duration to int and push to the array
        } else {
          // Stop when encountering the last "TRANSIT" step
          break;
        }
      }

      // Calculate the sum of first mile and last mile durations
      const sumFirstMileDuration = firstMileDuration.reduce((acc, duration) => acc + duration, 0);
      const sumLastMileDuration = lastMileDuration.reduce((acc, duration) => acc + duration, 0);
      const firstMilePrice = 3 + (0.275 * sumFirstMileDuration) + (3 * (firstMileDistance * 0.00062137)) + 1.75
      const lastMilePrice = 3 + (0.275 * sumLastMileDuration) + (3 * (lastMileDistance * 0.00062137)) + 1.75

      return {
        transit1,
        transit2,
        firstMileDistance,
        lastMileDistance,
        firstMileDuration: sumFirstMileDuration, // Replace the array with the sum
        lastMileDuration: sumLastMileDuration,   // Replace the array with the sum
        firstMilePrice: firstMilePrice.toFixed(2),
        lastMilePrice : lastMilePrice.toFixed(2)
      };
    }
  }
  return null;
}

console.log(parseTransitResponse(data));