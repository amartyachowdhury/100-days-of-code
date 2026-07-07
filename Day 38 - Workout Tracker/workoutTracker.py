import os
from datetime import datetime

import requests

EXERCISE_ENDPOINT = "https://app.100daysofpython.dev/v1/nutrition/natural/exercise"
GENDER = os.environ.get("GENDER", "male")
WEIGHT_KG = float(os.environ.get("WEIGHT_KG", "84"))
HEIGHT_CM = float(os.environ.get("HEIGHT_CM", "180"))
AGE = int(os.environ.get("AGE", "32"))
NIX_APP_ID = os.environ.get("ENV_NIX_APP_ID", "YOUR NIX APP ID")
NIX_API_KEY = os.environ.get("ENV_NIX_API_KEY", "YOUR NIX API KEY")
SHEETY_ENDPOINT = os.environ.get("ENV_SHEETY_ENDPOINT", "YOUR SHEETY ENDPOINT")
SHEETY_USERNAME = os.environ.get("ENV_SHEETY_USERNAME", "YOUR SHEETY USERNAME")
SHEETY_PASSWORD = os.environ.get("ENV_SHEETY_PASSWORD", "YOUR SHEETY PASSWORD")
GOOGLE_SHEET_NAME = os.environ.get("GOOGLE_SHEET_NAME", "workout")


def nutrition_headers():
    return {
        "x-app-id": NIX_APP_ID,
        "x-app-key": NIX_API_KEY,
    }


def fetch_exercises(exercise_text):
    response = requests.post(
        EXERCISE_ENDPOINT,
        json={
            "query": exercise_text,
            "gender": GENDER,
            "weight_kg": WEIGHT_KG,
            "height_cm": HEIGHT_CM,
            "age": AGE,
        },
        headers=nutrition_headers(),
        timeout=10,
    )
    response.raise_for_status()
    return response.json()["exercises"]


def build_sheet_inputs(exercise, date, time):
    return {
        GOOGLE_SHEET_NAME: {
            "date": date,
            "time": time,
            "exercise": exercise["name"].title(),
            "duration": exercise["duration_min"],
            "calories": exercise["nf_calories"],
        }
    }


def log_workout_to_sheet(sheet_inputs):
    response = requests.post(
        SHEETY_ENDPOINT,
        json=sheet_inputs,
        auth=(SHEETY_USERNAME, SHEETY_PASSWORD),
        timeout=10,
    )
    response.raise_for_status()
    return response


def main():
    exercise_text = input("Tell me which exercises you did: ").strip()
    if not exercise_text:
        print("No exercises entered.")
        return

    exercises = fetch_exercises(exercise_text)
    today_date = datetime.now().strftime("%d/%m/%Y")
    now_time = datetime.now().strftime("%X")

    for exercise in exercises:
        sheet_inputs = build_sheet_inputs(exercise, today_date, now_time)
        response = log_workout_to_sheet(sheet_inputs)
        print(f"Logged {exercise['name'].title()}. Sheety response: {response.text}")


if __name__ == "__main__":
    main()
