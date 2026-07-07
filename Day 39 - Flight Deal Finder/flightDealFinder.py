import os
from datetime import datetime, timedelta

import requests_cache

from data_manager import DataManager
from flight_data import find_cheapest_flight
from flight_search import FlightSearch
from notification_manager import NotificationManager

ORIGIN_CITY_IATA = os.environ.get("ORIGIN_CITY_IATA", "LHR")
SEARCH_DAYS_AHEAD = int(os.environ.get("SEARCH_DAYS_AHEAD", "180"))


def setup_cache():
    requests_cache.install_cache(
        "flight_cache",
        urls_expire_after={
            "*.sheety.co*": requests_cache.DO_NOT_CACHE,
            "*": 3600,
        },
    )


def search_window():
    tomorrow = datetime.now() + timedelta(days=1)
    end_date = datetime.now() + timedelta(days=SEARCH_DAYS_AHEAD)
    return tomorrow, end_date


def build_alert_message(cheapest_flight):
    return (
        f"Low price alert! Only GBP {cheapest_flight.price} to fly "
        f"from {cheapest_flight.origin_airport} to {cheapest_flight.destination_airport}, "
        f"on {cheapest_flight.out_date} until {cheapest_flight.return_date}."
    )


def main():
    setup_cache()

    data_manager = DataManager()
    flight_search = FlightSearch()
    notification_manager = NotificationManager()
    sheet_data = data_manager.get_destination_data()
    tomorrow, end_date = search_window()
    return_date = end_date.strftime("%Y-%m-%d")

    for destination in sheet_data:
        print(f"Getting flights for {destination['city']}...")
        flights = flight_search.check_flights(
            ORIGIN_CITY_IATA,
            destination["iataCode"],
            from_time=tomorrow,
            to_time=end_date,
        )
        cheapest_flight = find_cheapest_flight(flights, return_date=return_date)
        print(f"{destination['city']}: GBP {cheapest_flight.price}")

        if (
            cheapest_flight.price != "N/A"
            and cheapest_flight.price < destination["lowestPrice"]
        ):
            print(f"Lower price flight found to {destination['city']}!")
            data_manager.update_lowest_price(destination["id"], cheapest_flight.price)
            notification_manager.send_whatsapp(
                message_body=build_alert_message(cheapest_flight)
            )


if __name__ == "__main__":
    main()
