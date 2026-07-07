# Workout Tracker

## Objective

Build an exercise tracking app using natural language processing and Google Sheets.

You **won't** be able to run the CLI as-is until you add your own API keys as environment variables.

## Environment Variables

Set these before running `workoutTracker.py`:

- `ENV_NIX_APP_ID`
- `ENV_NIX_API_KEY`
- `ENV_SHEETY_ENDPOINT`
- `ENV_SHEETY_USERNAME`
- `ENV_SHEETY_PASSWORD`

Optional:

- `GENDER`, `WEIGHT_KG`, `HEIGHT_CM`, `AGE`
- `GOOGLE_SHEET_NAME` (defaults to `workout`)

## FAQ KeyError

The name of your environment variables in Python must match what you set in your shell or IDE. If you use:

```
NIX_API_KEY = os.environ["ENV_NIX_API_KEY"]
```

then your environment variable must also be called `ENV_NIX_API_KEY`.

## FAQ Sheety: Insufficient Permission

Sheety needs permission to access your Google Sheet. When you sign into Sheety you probably forgot to give it permission. Sign out of Sheety and sign in again. Also, go to your Google Account -> Security -> Third Party Apps with Account Access. Check that you see Sheety listed there.

## FAQ Sheety: Bad Request. The JSON Payload should be inside a root property called "X"

Your Google sheet's name should be plural – if it isn’t then Sheety will still expect it to be camelCase plural in the API endpoint. i.e. if your sheet is named "My Workouts", then you should use "myWorkouts" in your endpoint.
The Project name in the endpoint must also be camelCase.
The name you use for the primary key in the API call should be the camelCase singular version of the sheet name. i.e. if your sheet is named "My Workouts", then you should use "myWorkout" in your API dictionary. You may also need to refresh the API page on Sheety.
