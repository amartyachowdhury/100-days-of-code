const EXERCISE_ENDPOINT = "https://app.100daysofpython.dev/v1/nutrition/natural/exercise";

const workoutForm = document.getElementById("workoutForm");
const exerciseTextInput = document.getElementById("exerciseText");
const genderInput = document.getElementById("gender");
const weightKgInput = document.getElementById("weightKg");
const heightCmInput = document.getElementById("heightCm");
const ageInput = document.getElementById("age");
const nixAppIdInput = document.getElementById("nixAppId");
const nixApiKeyInput = document.getElementById("nixApiKey");
const sheetNameInput = document.getElementById("sheetName");
const sheetyEndpointInput = document.getElementById("sheetyEndpoint");
const sheetyUsernameInput = document.getElementById("sheetyUsername");
const sheetyPasswordInput = document.getElementById("sheetyPassword");
const statusElement = document.getElementById("status");
const resultsElement = document.getElementById("results");
const exerciseListElement = document.getElementById("exerciseList");
const sheetPreviewElement = document.getElementById("sheetPreview");
const notificationElement = document.getElementById("notification");

function formatNow() {
  const now = new Date();
  const date = now.toLocaleDateString("en-GB");
  const time = now.toLocaleTimeString("en-GB", { hour12: false });
  return { date, time };
}

function buildSheetPayload(exercise, sheetName, date, time) {
  return {
    [sheetName]: {
      date,
      time,
      exercise: exercise.name.replace(/\b\w/g, (char) => char.toUpperCase()),
      duration: exercise.duration_min,
      calories: exercise.nf_calories,
    },
  };
}

function addExerciseItem(exercise) {
  const item = document.createElement("li");
  item.textContent =
    `${exercise.name} — ${exercise.duration_min} min, ${exercise.nf_calories} kcal`;
  exerciseListElement.append(item);
}

function addSheetPreview(payload) {
  const card = document.createElement("div");
  card.className = "sheet-row";
  card.textContent = JSON.stringify(payload, null, 2);
  sheetPreviewElement.append(card);
}

async function fetchExercises(exerciseText, stats, nixAppId, nixApiKey) {
  const response = await fetch(EXERCISE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-id": nixAppId,
      "x-app-key": nixApiKey,
    },
    body: JSON.stringify({
      query: exerciseText,
      gender: stats.gender,
      weight_kg: stats.weightKg,
      height_cm: stats.heightCm,
      age: stats.age,
    }),
  });

  if (!response.ok) {
    throw new Error("Nutritionix request failed.");
  }

  const payload = await response.json();
  return payload.exercises || [];
}

async function logToSheety(endpoint, username, password, payload) {
  const credentials = btoa(`${username}:${password}`);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Sheety request failed.");
  }

  return response.text();
}

async function trackWorkout(event) {
  event.preventDefault();
  statusElement.textContent = "Calculating exercises and preparing sheet rows...";
  resultsElement.hidden = true;
  notificationElement.hidden = true;
  exerciseListElement.innerHTML = "";
  sheetPreviewElement.innerHTML = "";

  const exerciseText = exerciseTextInput.value.trim();
  const stats = {
    gender: genderInput.value,
    weightKg: Number(weightKgInput.value),
    heightCm: Number(heightCmInput.value),
    age: Number(ageInput.value),
  };
  const nixAppId = nixAppIdInput.value.trim();
  const nixApiKey = nixApiKeyInput.value.trim();
  const sheetName = sheetNameInput.value.trim() || "workout";
  const sheetyEndpoint = sheetyEndpointInput.value.trim();
  const sheetyUsername = sheetyUsernameInput.value.trim();
  const sheetyPassword = sheetyPasswordInput.value.trim();

  if (!exerciseText) {
    statusElement.textContent = "Please describe the workout you completed.";
    return;
  }

  if (!nixAppId || !nixApiKey) {
    statusElement.textContent = "Please enter your Nutritionix app ID and API key.";
    return;
  }

  if (Object.values(stats).some((value) => Number.isNaN(value))) {
    statusElement.textContent = "Please enter valid personal stats.";
    return;
  }

  try {
    const exercises = await fetchExercises(exerciseText, stats, nixAppId, nixApiKey);

    if (!exercises.length) {
      statusElement.textContent = "No exercises were recognized. Try a more specific description.";
      return;
    }

    const { date, time } = formatNow();
    let sheetyConfigured =
      sheetyEndpoint && sheetyUsername && sheetyPassword;

    for (const exercise of exercises) {
      addExerciseItem(exercise);
      const payload = buildSheetPayload(exercise, sheetName, date, time);
      addSheetPreview(payload);

      if (sheetyConfigured) {
        try {
          await logToSheety(
            sheetyEndpoint,
            sheetyUsername,
            sheetyPassword,
            payload,
          );
        } catch {
          sheetyConfigured = false;
        }
      }
    }

    resultsElement.hidden = false;
    notificationElement.hidden = false;
    statusElement.textContent = sheetyConfigured
      ? "Workout tracked and sent to your Google Sheet."
      : "Exercises calculated. Sheety credentials were missing or blocked in the browser, so only the preview is shown.";
  } catch {
    statusElement.textContent =
      "Could not calculate the workout. Check your Nutritionix credentials and try again.";
  }
}

workoutForm.addEventListener("submit", trackWorkout);
