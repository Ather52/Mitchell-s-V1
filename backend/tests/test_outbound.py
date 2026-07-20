import pytest

from src.api.outbound.utils import (
    clean_customer_value,
    validate_phone_number,
    normalize_phone_number,
    parse_csv_contacts,
    parse_json_contacts,
    merge_contact_payload,
    map_retell_call_status,
    contact_status_for_call_status,
)


def test_normalize_phone_adds_plus():
    assert normalize_phone_number("14155551234") == "+14155551234"


def test_validate_phone_e164():
    assert validate_phone_number("+14155551234") == "+14155551234"


def test_validate_phone_invalid():
    with pytest.raises(ValueError):
        validate_phone_number("not-a-phone")


def test_parse_csv_contacts():
    csv_content = "name,phone_number,language_preference\nJohn,+14155551234,Urdu\n"
    contacts = parse_csv_contacts(csv_content)
    assert len(contacts) == 1
    assert contacts[0]["name"] == "John"
    assert contacts[0]["phone_number"] == "+14155551234"
    assert contacts[0]["language_preference"] == "Urdu"


def test_parse_json_contacts_list():
    content = '[{"name": "Jane", "phone_number": "+14155559999"}]'
    contacts = parse_json_contacts(content)
    assert len(contacts) == 1
    assert contacts[0]["name"] == "Jane"


def test_merge_contact_payload():
    name, company, meta = merge_contact_payload(
        shop_name="Ali Store",
        owner_name="Ali Khan",
        customer_city="Lahore",
        last_order="2x Mango Jam",
        customer_type="existing",
    )
    assert name == "Ali Khan"
    assert company == "Ali Store"
    assert meta["customer_city"] == "Lahore"
    assert meta["customer_type"] == "existing"


def test_clean_customer_value_rejects_own_company():
    assert clean_customer_value("Mitchell's Fruit Farms") is None
    assert clean_customer_value("Mitchells") is None
    assert clean_customer_value("Fresh Mart") == "Fresh Mart"


def test_merge_contact_payload_rejects_own_company_as_customer():
    name, company, meta = merge_contact_payload(
        shop_name="Mitchell's Fruit Farms",
        owner_name="Mitchells",
        customer_city="Lahore",
    )
    assert name is None
    assert company is None
    assert meta["customer_city"] == "Lahore"


def test_parse_csv_with_outbound_columns():
    csv_content = (
        "shop_name,owner_name,phone_number,customer_city,last_order,customer_type\n"
        "Fresh Mart,Sara Ali,+14155551234,Karachi,3x Squash,existing\n"
    )
    contacts = parse_csv_contacts(csv_content)
    assert contacts[0]["company"] == "Fresh Mart"
    assert contacts[0]["name"] == "Sara Ali"
    assert contacts[0]["metadata"]["customer_city"] == "Karachi"


def test_map_retell_call_status_started():
    assert map_retell_call_status({"call_status": "registered"}, "call_started") == "ongoing"


def test_map_retell_call_status_ended_event():
    data = {"call_status": "ongoing", "end_timestamp": 1714608491736}
    assert map_retell_call_status(data, "call_ended") == "ended"


def test_map_retell_call_status_analyzed_event():
    data = {"call_status": "ongoing"}
    assert map_retell_call_status(data, "call_analyzed") == "ended"


def test_map_retell_call_status_not_connected():
    data = {"call_status": "not_connected"}
    assert map_retell_call_status(data, "call_ended") == "failed"


def test_contact_status_for_call_status():
    assert contact_status_for_call_status("ended") == "completed"
    assert contact_status_for_call_status("ongoing") == "calling"
    assert contact_status_for_call_status("failed") == "failed"
