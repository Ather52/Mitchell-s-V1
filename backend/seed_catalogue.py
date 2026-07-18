import asyncio
import uuid
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.utils.db import engine, MenuCategory, MenuItem, get_db

CATALOGUE = [
    {
        "category_name": "BEVERAGES — SQUASHES",
        "items": [
            {"name": "Mango Squash 800ml", "price": 2160, "desc": "12 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Mango Squash 1.4L", "price": 2100, "desc": "6 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Mixed Fruit Squash 800ml", "price": 2040, "desc": "12 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Mixed Fruit Squash 1.4L", "price": 1980, "desc": "6 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Lemon Squash 800ml", "price": 1920, "desc": "12 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Orange Squash 800ml", "price": 1920, "desc": "12 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Strawberry Squash 800ml", "price": 2040, "desc": "12 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Red Grape Squash 800ml", "price": 2160, "desc": "12 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Lemon Barley Squash 800ml", "price": 1920, "desc": "12 btl/ctn, Trade Price (Rs/ctn)"},
        ]
    },
    {
        "category_name": "BEVERAGES — SYRUPS",
        "items": [
            {"name": "JAM-e-Hayat 800ml", "price": 2400, "desc": "12 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "JAM-e-Hayat 1400ml", "price": 2580, "desc": "6 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Rose Syrup 730ml", "price": 2160, "desc": "12 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Lemon Juice 300ml", "price": 1440, "desc": "12 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Lemon Juice 800ml", "price": 2400, "desc": "12 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Rose's Lime Juice Cordial 730ml", "price": 2760, "desc": "12 btl/ctn, Trade Price (Rs/ctn)"},
        ]
    },
    {
        "category_name": "PRESERVES — JAMS",
        "items": [
            {"name": "Golden Apple JAM 200gm", "price": 1560, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Golden Apple JAM 450gm", "price": 2880, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Golden Apple JAM 1050gm", "price": 3480, "desc": "6 cans/ctn, Trade Price (Rs/ctn)"},
            {"name": "Mixed Fruit JAM 200gm", "price": 1560, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Mixed Fruit JAM 450gm", "price": 2880, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Mixed Fruit JAM 1050gm", "price": 3480, "desc": "6 cans/ctn, Trade Price (Rs/ctn)"},
            {"name": "Mango JAM 200gm", "price": 1680, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Mango JAM 450gm", "price": 3000, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Mango JAM 1050gm", "price": 3600, "desc": "6 cans/ctn, Trade Price (Rs/ctn)"},
            {"name": "Strawberry JAM 200gm", "price": 1800, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Strawberry JAM 340gm", "price": 2760, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Strawberry JAM 1050gm", "price": 3720, "desc": "6 cans/ctn, Trade Price (Rs/ctn)"},
            {"name": "Red Grape JAM 450gm", "price": 3120, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Fig JAM 450gm", "price": 3120, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Apricot JAM 340gm", "price": 2760, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Pineapple JAM 340gm", "price": 2640, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Black Currant JAM 340gm", "price": 2760, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Diet Golden Apple JAM 325gm", "price": 3120, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Diet Mixed Fruit JAM 325gm", "price": 3120, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Diet Strawberry JAM 325gm", "price": 3120, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
        ]
    },
    {
        "category_name": "PRESERVES — MARMALADES",
        "items": [
            {"name": "Golden Mist Marmalade 200gm", "price": 1680, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Golden Mist Marmalade 450gm", "price": 2880, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Golden Mist Marmalade 1050gm", "price": 3480, "desc": "6 cans/ctn, Trade Price (Rs/ctn)"},
            {"name": "Olde English Marmalade 450gm", "price": 2880, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Lemon Ginger Marmalade 450gm", "price": 3000, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Diet Golden Mist Marmalade 325gm", "price": 3120, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Rose's Lime Marmalade", "price": 3240, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
        ]
    },
    {
        "category_name": "PRESERVES — JELLIES",
        "items": [
            {"name": "Apple Jelly 200gm", "price": 1560, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Apple Jelly 450gm", "price": 2640, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Strawberry Jelly 450gm", "price": 2760, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Raspberry Jelly 450gm", "price": 2760, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Pineapple Jelly 450gm", "price": 2640, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
        ]
    },
    {
        "category_name": "KETCHUP & SAUCES",
        "items": [
            {"name": "Tomato Ketchup 300gm bottle", "price": 2040, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Tomato Ketchup 825gm bottle", "price": 4320, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Tomato Ketchup 250gm pouch", "price": 3240, "desc": "36/ctn, Trade Price (Rs/ctn)"},
            {"name": "Tomato Ketchup 500gm pouch", "price": 2160, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Tomato Ketchup 1kg pouch", "price": 3600, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Tomato Ketchup 40gm sachet", "price": 1920, "desc": "192/ctn, Trade Price (Rs/ctn)"},
            {"name": "Tomato Ketchup 100gm sachet", "price": 2400, "desc": "96/ctn, Trade Price (Rs/ctn)"},
            {"name": "Chilli Garlic Sauce 300gm bottle", "price": 2160, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Chilli Garlic Sauce 825gm bottle", "price": 4800, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Chilli Garlic Sauce 250gm pouch", "price": 3240, "desc": "36/ctn, Trade Price (Rs/ctn)"},
            {"name": "Chilli Garlic Sauce 500gm pouch", "price": 2160, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Chilli Garlic Sauce 1kg pouch", "price": 3720, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Chilli Garlic Sauce 10gm sachet", "price": 2500, "desc": "500/ctn, Trade Price (Rs/ctn)"},
            {"name": "Imlee Sauce 300gm", "price": 1920, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Imlee Sauce 825gm", "price": 3960, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "BBQ Sauce 300gm", "price": 2040, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Sweet Chilli Sauce 330gm", "price": 2040, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Green Chilli Sauce 280gm", "price": 1920, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Chaat Sauce 300gm", "price": 2040, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Jalapeno Sauce 300gm", "price": 2160, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Habanero Sauce 300gm", "price": 2160, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Chipotle Sauce 300gm", "price": 2160, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Peri Peri Sauce Hot 260gm", "price": 2160, "desc": "12/ctn, Trade Price (Rs/ctn)"},
            {"name": "Peri Peri Sauce Medium 260gm", "price": 2160, "desc": "12/ctn, Trade Price (Rs/ctn)"},
        ]
    },
    {
        "category_name": "PICKLES",
        "items": [
            {"name": "Mango Pickle 360gm", "price": 2640, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Mango Pickle 400gm", "price": 2880, "desc": "12 jars/ctn, Trade Price (Rs/ctn)"},
            {"name": "Mango Pickle 1kg", "price": 3600, "desc": "6 btl/ctn, Trade Price (Rs/ctn)"},
            {"name": "Mixed Pickle 360gm", "price": 2640, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Mixed Pickle 400gm", "price": 2880, "desc": "12 jars/ctn, Trade Price (Rs/ctn)"},
            {"name": "Mixed Pickle 1kg", "price": 3600, "desc": "6 jars/ctn, Trade Price (Rs/ctn)"},
            {"name": "Mango Hyderabadi Pickle 360gm", "price": 2760, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
            {"name": "Mixed Hyderabadi Pickle 360gm", "price": 2760, "desc": "12 jars/ctn, Trade Price (Rs/ctn)"},
            {"name": "Garlic Pickle 360gm", "price": 2760, "desc": "12 jars/ctn, Trade Price (Rs/ctn)"},
            {"name": "Green Chilli Pickle 330gm", "price": 2520, "desc": "12 jars/ctn, Trade Price (Rs/ctn)"},
            {"name": "Lime Pickle 340gm", "price": 2520, "desc": "12 jars/ctn, Trade Price (Rs/ctn)"},
            {"name": "Carrot Pickle 340gm", "price": 2400, "desc": "12 jars/tray, Trade Price (Rs/tray)"},
        ]
    },
    {
        "category_name": "CHUTNEYS",
        "items": [
            {"name": "Mango Chutney 420gm", "price": 2760, "desc": "12 jars/ctn, Trade Price (Rs/ctn)"},
            {"name": "Plum Chutney 420gm", "price": 2760, "desc": "12 jars/ctn, Trade Price (Rs/ctn)"},
            {"name": "Hari Chutney 350gm", "price": 2520, "desc": "12 jars/ctn, Trade Price (Rs/ctn)"},
            {"name": "Mexican Salsa 370gm", "price": 2760, "desc": "12 jars/ctn, Trade Price (Rs/ctn)"},
        ]
    },
    {
        "category_name": "CHOCOLATES",
        "items": [
            {"name": "Jubilee 10gm", "price": 1440, "desc": "12 disp. boxes/ctn, Trade Price (Rs/ctn)"},
            {"name": "Jubilee 10gm (small display)", "price": 3600, "desc": "36 disp. boxes/ctn, Trade Price (Rs/ctn)"},
            {"name": "Jubilee 20gm", "price": 2640, "desc": "12 disp. boxes/ctn, Trade Price (Rs/ctn)"},
            {"name": "Jubilee 36gm", "price": 3600, "desc": "12 disp. boxes/ctn, Trade Price (Rs/ctn)"},
            {"name": "Happy Hearts 7.5gm", "price": 1200, "desc": "12 boxes/ctn, Trade Price (Rs/ctn)"},
        ]
    },
    {
        "category_name": "SUGAR CONFECTIONERY",
        "items": [
            {"name": "Eclairs 50gm polybag", "price": 2520, "desc": "36 bags/ctn, Trade Price (Rs/ctn)"},
            {"name": "Eclairs 125gm", "price": 2880, "desc": "24 boxes/ctn, Trade Price (Rs/ctn)"},
            {"name": "Eclairs 220gm box", "price": 3000, "desc": "20 boxes/ctn, Trade Price (Rs/ctn)"},
            {"name": "Eclairs 260gm polybag", "price": 3400, "desc": "20 bags/ctn, Trade Price (Rs/ctn)"},
            {"name": "Milk Toffees 50-candy polybag", "price": 2160, "desc": "36 bags/ctn, Trade Price (Rs/ctn)"},
            {"name": "Milk Toffees 125gm", "price": 1800, "desc": "20 boxes/ctn, Trade Price (Rs/ctn)"},
            {"name": "Butterscotch 125gm", "price": 2160, "desc": "24 boxes/ctn, Trade Price (Rs/ctn)"},
            {"name": "Butterscotch 220gm", "price": 2600, "desc": "20 boxes/ctn, Trade Price (Rs/ctn)"},
            {"name": "Fruit Bon Bon 50-candy standup pouch", "price": 1920, "desc": "24 pouches/ctn, Trade Price (Rs/ctn)"},
            {"name": "Fruit Bon Bon 260gm polybag", "price": 2600, "desc": "20 bags/ctn, Trade Price (Rs/ctn)"},
        ]
    }
]

async def seed():
    async for session in get_db():
        for i, cat_data in enumerate(CATALOGUE):
            # Check if category exists
            cat_result = await session.execute(select(MenuCategory).where(MenuCategory.name == cat_data["category_name"]))
            cat_obj = cat_result.scalar_one_or_none()
            if not cat_obj:
                cat_obj = MenuCategory(
                    id=str(uuid.uuid4()),
                    name=cat_data["category_name"],
                    description="",
                    sort_order=i,
                    is_available=True
                )
                session.add(cat_obj)
                await session.commit()
                print(f"Added category: {cat_data['category_name']}")
            
            for j, item_data in enumerate(cat_data["items"]):
                item_result = await session.execute(select(MenuItem).where(MenuItem.name == item_data["name"]))
                item_obj = item_result.scalar_one_or_none()
                if item_obj:
                    item_obj.price = float(item_data["price"])
                    item_obj.description = item_data["desc"]
                    item_obj.category_id = cat_obj.id
                    session.add(item_obj)
                    print(f"Updated item: {item_data['name']}")
                else:
                    item_obj = MenuItem(
                        id=str(uuid.uuid4()),
                        category_id=cat_obj.id,
                        name=item_data["name"],
                        description=item_data["desc"],
                        price=float(item_data["price"]),
                        is_available=True,
                        sort_order=j
                    )
                    session.add(item_obj)
                    print(f"Added item: {item_data['name']}")
            await session.commit()
        break
    print("Done seeding catalogue!")

if __name__ == "__main__":
    asyncio.run(seed())
