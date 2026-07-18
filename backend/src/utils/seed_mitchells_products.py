import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
load_dotenv(os.path.join(backend_dir, ".env"))

sys.path.append(backend_dir)

from src.utils.db import AsyncSessionLocal, MenuCategory, MenuItem
from sqlalchemy import delete

# ─────────────────────────────────────────────────────────────────────────────
# MITCHELL'S FRUIT FARMS LIMITED — COMPLETE PRODUCT CATALOG
# Prices are per standard retail unit (pack/jar/bottle/box).
# Unit size is included in the description so the AI and staff can calculate
# bulk quantities: e.g. "200g jar" means 1 unit = 200g jar.
# ─────────────────────────────────────────────────────────────────────────────
PRODUCT_CATALOG = {

    # ── 1. JAMS, JELLIES & MARMALADES ────────────────────────────────────────
    "Jams, Jellies & Marmalades": {
        "description": "Authentic, rich fruit preserves made from carefully chosen fresh fruits. Available in standard 450g jars.",
        "items": [
            {
                "name": "Mango Jam",
                "description": "Sweet and luscious mango jam from premium Pakistani mangoes. Unit: 450g jar — PKR 340/jar.",
                "price": 340,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Mixed Fruit Jam",
                "description": "A delightful blend of fresh seasonal fruits in one jar. Unit: 450g jar — PKR 320/jar.",
                "price": 320,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Strawberry Jam",
                "description": "Juicy strawberries cooked into a rich, sweet spread. Unit: 450g jar — PKR 350/jar.",
                "price": 350,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Pineapple Jam",
                "description": "Tangy and sweet jam loaded with tropical pineapple bits. Unit: 450g jar — PKR 330/jar.",
                "price": 330,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Guava Jam",
                "description": "Classic Pakistani guava jam with a delicate floral sweetness. Unit: 450g jar — PKR 320/jar.",
                "price": 320,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Apricot Jam",
                "description": "Golden apricot jam with a naturally tart and sweet flavour. Unit: 450g jar — PKR 340/jar.",
                "price": 340,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Plum Jam",
                "description": "Rich, deep-purple plum jam with a balanced sweet-sour taste. Unit: 450g jar — PKR 330/jar.",
                "price": 330,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Red Grape Jam",
                "description": "Smooth red grape jam with a full-bodied fruity flavour. Unit: 450g jar — PKR 360/jar.",
                "price": 360,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Apple Jelly",
                "description": "Clear and sweet apple jelly, perfect as a spread or glaze. Unit: 450g jar — PKR 310/jar.",
                "price": 310,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Strawberry Jelly",
                "description": "Crystal-clear strawberry jelly with intense berry flavour. Unit: 450g jar — PKR 340/jar.",
                "price": 340,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Pineapple Jelly",
                "description": "Bright tropical pineapple jelly, smooth and translucent. Unit: 450g jar — PKR 330/jar.",
                "price": 330,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Raspberry Jelly",
                "description": "Vibrant raspberry jelly with a pleasantly tart finish. Unit: 450g jar — PKR 360/jar.",
                "price": 360,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Golden Mist Marmalade",
                "description": "Classic orange marmalade with fine peel shreds and bright citrus tang. Unit: 450g jar — PKR 320/jar.",
                "price": 320,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Lemon Ginger Marmalade",
                "description": "Zesty lemon marmalade with warming ginger notes — a premium breakfast spread. Unit: 450g jar — PKR 350/jar.",
                "price": 350,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Diet Golden Mist Marmalade",
                "description": "Sugar-free orange marmalade, great for health-conscious consumers. Unit: 450g jar — PKR 340/jar.",
                "price": 340,
                "allergens": None,
                "prep_time_minutes": 0,
            },
        ],
    },

    # ── 2. SQUASHES, SYRUPS & JUICES ─────────────────────────────────────────
    "Squashes, Syrups & Juices": {
        "description": "Refreshing concentrated fruit squashes, syrups and juices made with real fruit. Standard 800ml bottles.",
        "items": [
            {
                "name": "Lemon Squash",
                "description": "Refreshing squash made with natural lemon juice concentrate. Unit: 800ml bottle — PKR 340/bottle.",
                "price": 340,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Orange Squash",
                "description": "Zesty orange squash packed with citrus flavour. Unit: 800ml bottle — PKR 340/bottle.",
                "price": 340,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Mango Squash",
                "description": "Rich mango pulp concentrate for a refreshing summer drink. Unit: 800ml bottle — PKR 340/bottle.",
                "price": 340,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Strawberry Squash",
                "description": "Sweet, vibrant strawberry squash made from real strawberry juice. Unit: 800ml bottle — PKR 340/bottle.",
                "price": 340,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Red Grape Squash",
                "description": "Deep, fruity red grape squash — dilute with chilled water to serve. Unit: 800ml bottle — PKR 350/bottle.",
                "price": 350,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Lemon Barley Squash",
                "description": "Classic lemon & barley squash with a smooth, slightly creamy texture. Unit: 800ml bottle — PKR 350/bottle.",
                "price": 350,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Lime Juice Cordial",
                "description": "Clear and sweet lime cordial, perfect for mixing into mocktails or cold drinks. Unit: 800ml bottle — PKR 340/bottle.",
                "price": 340,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Lemon Juice",
                "description": "Pure squeezed lemon juice, ready to use in cooking or drinks. Unit: 800ml bottle — PKR 330/bottle.",
                "price": 330,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Rose Syrup",
                "description": "Fragrant rose syrup for milk-based drinks (Rooh Afza style). Unit: 800ml bottle — PKR 360/bottle.",
                "price": 360,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Khus Syrup",
                "description": "Cooling vetiver (khus) syrup — traditional summer favourite. Unit: 800ml bottle — PKR 360/bottle.",
                "price": 360,
                "allergens": None,
                "prep_time_minutes": 0,
            },
        ],
    },

    # ── 3. KETCHUPS & SAUCES ─────────────────────────────────────────────────
    "Ketchups & Sauces": {
        "description": "Tangy tomato ketchups, spicy sauces and purees to complement every meal. Standard 800g bottles.",
        "items": [
            {
                "name": "Tomato Ketchup",
                "description": "Traditional thick tomato ketchup from vine-ripened tomatoes. Unit: 800g bottle — PKR 280/bottle.",
                "price": 280,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Tomato Ketchup (Small)",
                "description": "Same great tomato ketchup in a handy small bottle. Unit: 300g bottle — PKR 130/bottle.",
                "price": 130,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Chili Garlic Sauce",
                "description": "Zesty sauce blending hot red chilies with fresh garlic — great dipping sauce. Unit: 300g bottle — PKR 195/bottle.",
                "price": 195,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Tamarind (Imli) Sauce",
                "description": "Traditional sweet and sour tamarind dipping sauce. Unit: 300g bottle — PKR 220/bottle.",
                "price": 220,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Hot Chili Sauce",
                "description": "Fiery hot red chili sauce — add heat to any dish. Unit: 300g bottle — PKR 200/bottle.",
                "price": 200,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Green Chili Sauce",
                "description": "Sharp and spicy sauce made from fresh green chilies. Unit: 300g bottle — PKR 240/bottle.",
                "price": 240,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Tomato Puree",
                "description": "Smooth, concentrated tomato puree — a kitchen essential for curries and pasta. Unit: 800g bottle — PKR 260/bottle.",
                "price": 260,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Tomato Paste",
                "description": "Thick double-concentrated tomato paste for rich, intense tomato flavour. Unit: 210g tin — PKR 120/tin.",
                "price": 120,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "White Vinegar",
                "description": "Pure distilled white vinegar — ideal for pickling, cooking and cleaning. Unit: 800ml bottle — PKR 140/bottle.",
                "price": 140,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Malt Vinegar",
                "description": "Tangy malt vinegar with a rich brown colour, great on chips. Unit: 800ml bottle — PKR 180/bottle.",
                "price": 180,
                "allergens": "Gluten",
                "prep_time_minutes": 0,
            },
        ],
    },

    # ── 4. PICKLES (ACHAR) & CHUTNEYS ────────────────────────────────────────
    "Pickles (Achar) & Chutneys": {
        "description": "Traditional pickles seasoned with aromatic spices in premium oil, and tangy chutneys. Standard 800g jars.",
        "items": [
            {
                "name": "Mango Pickle in Oil",
                "description": "Tangy green mangoes pickled in mustard oil with traditional spices. Unit: 800g jar — PKR 420/jar.",
                "price": 420,
                "allergens": "Mustard",
                "prep_time_minutes": 0,
            },
            {
                "name": "Mixed Pickle in Oil",
                "description": "A savory mix of vegetables and mangoes in aromatic spiced mustard oil. Unit: 800g jar — PKR 400/jar.",
                "price": 400,
                "allergens": "Mustard",
                "prep_time_minutes": 0,
            },
            {
                "name": "Mixed Hyderabadi Pickle",
                "description": "Bold Hyderabadi-style pickle with whole spices and a powerful kick. Unit: 800g jar — PKR 420/jar.",
                "price": 420,
                "allergens": "Mustard",
                "prep_time_minutes": 0,
            },
            {
                "name": "Garlic Pickle in Oil",
                "description": "Whole garlic cloves pickled with aromatic spices in oil — deeply flavourful. Unit: 800g jar — PKR 400/jar.",
                "price": 400,
                "allergens": "Mustard",
                "prep_time_minutes": 0,
            },
            {
                "name": "Green Chili Pickle",
                "description": "Whole green chilies pickled in spiced mustard oil — extra hot and tangy. Unit: 400g jar — PKR 280/jar.",
                "price": 280,
                "allergens": "Mustard",
                "prep_time_minutes": 0,
            },
            {
                "name": "Lime Pickle",
                "description": "Sharp, sour lime pieces pickled with salt and spices — a classic condiment. Unit: 400g jar — PKR 270/jar.",
                "price": 270,
                "allergens": "Mustard",
                "prep_time_minutes": 0,
            },
            {
                "name": "Carrot Pickle",
                "description": "Crunchy carrot batons pickled with traditional spices, mild and tangy. Unit: 400g jar — PKR 260/jar.",
                "price": 260,
                "allergens": "Mustard",
                "prep_time_minutes": 0,
            },
            {
                "name": "Mango Chutney",
                "description": "Sweet and tangy raw mango chutney — perfect pairing for parathas and grills. Unit: 300g jar — PKR 240/jar.",
                "price": 240,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Plum Chutney",
                "description": "Rich, dark plum chutney with warming spices — great with meats and cheese. Unit: 300g jar — PKR 260/jar.",
                "price": 260,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Mexican Salsa",
                "description": "Chunky tomato-based salsa with mild chili heat and herbs. Unit: 300g jar — PKR 280/jar.",
                "price": 280,
                "allergens": None,
                "prep_time_minutes": 0,
            },
        ],
    },

    # ── 5. SPREADS & MAYONNAISE ───────────────────────────────────────────────
    "Spreads & Mayonnaise": {
        "description": "Creamy mayonnaise, mustard and other table spreads for sandwiches, salads and dips.",
        "items": [
            {
                "name": "Mayonnaise",
                "description": "Classic thick and creamy egg mayonnaise — the perfect sandwich spread. Unit: 500g jar — PKR 420/jar.",
                "price": 420,
                "allergens": "Egg",
                "prep_time_minutes": 0,
            },
            {
                "name": "Mayonnaise (Small)",
                "description": "Handy small size mayonnaise jar for household use. Unit: 250g jar — PKR 230/jar.",
                "price": 230,
                "allergens": "Egg",
                "prep_time_minutes": 0,
            },
            {
                "name": "Garlic Mayonnaise",
                "description": "Creamy mayo blended with roasted garlic for a bold, savoury flavour. Unit: 500g jar — PKR 450/jar.",
                "price": 450,
                "allergens": "Egg",
                "prep_time_minutes": 0,
            },
            {
                "name": "Mustard Paste",
                "description": "Smooth, tangy yellow mustard paste — great for sandwiches and marinades. Unit: 250g jar — PKR 200/jar.",
                "price": 200,
                "allergens": "Mustard",
                "prep_time_minutes": 0,
            },
            {
                "name": "Tahini (Sesame Paste)",
                "description": "Nutty, rich sesame seed paste ideal for hummus, dressings and dips. Unit: 300g jar — PKR 480/jar.",
                "price": 480,
                "allergens": "Sesame",
                "prep_time_minutes": 0,
            },
        ],
    },

    # ── 6. READY-TO-EAT / CANNED FOODS ───────────────────────────────────────
    "Ready-to-Eat & Canned Foods": {
        "description": "Convenient canned and ready-to-eat products including fruits, vegetables and cooked lentils.",
        "items": [
            {
                "name": "Fruit Cocktail (Canned)",
                "description": "Mixed diced fruits in light syrup — pineapple, peach, pear and cherries. Unit: 825g tin — PKR 380/tin.",
                "price": 380,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Pineapple Rings (Canned)",
                "description": "Juicy pineapple rings in light syrup, ideal for desserts and pizzas. Unit: 825g tin — PKR 360/tin.",
                "price": 360,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Pineapple Chunks (Canned)",
                "description": "Diced pineapple chunks in natural juice, ready to eat or use in cooking. Unit: 425g tin — PKR 220/tin.",
                "price": 220,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Sweet Corn (Canned)",
                "description": "Tender whole kernel sweet corn — use in salads, soups or as a side. Unit: 425g tin — PKR 200/tin.",
                "price": 200,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Channa Daal (Canned)",
                "description": "Pre-cooked yellow split chickpeas — rinse and heat to serve. Unit: 425g tin — PKR 180/tin.",
                "price": 180,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Lahori Channay (Canned)",
                "description": "Spiced whole chickpeas in a flavourful masala sauce — ready in minutes. Unit: 425g tin — PKR 200/tin.",
                "price": 200,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Baked Beans (Canned)",
                "description": "Tender navy beans in a mild tomato sauce — a breakfast and snack staple. Unit: 425g tin — PKR 180/tin.",
                "price": 180,
                "allergens": None,
                "prep_time_minutes": 0,
            },
        ],
    },

    # ── 7. CONFECTIONERY (SUGAR) ──────────────────────────────────────────────
    "Confectionery": {
        "description": "Delightful toffees, hard candies and sweets loved across generations. Standard 100-piece display boxes.",
        "items": [
            {
                "name": "Milk Toffees",
                "description": "Classic rich and chewy milk toffees — individually wrapped. Unit: 100-piece box — PKR 350/box.",
                "price": 350,
                "allergens": "Milk",
                "prep_time_minutes": 0,
            },
            {
                "name": "Butter Scotch",
                "description": "Smooth butterscotch hard candies with a caramel-buttery centre. Unit: 100-piece box — PKR 350/box.",
                "price": 350,
                "allergens": "Milk",
                "prep_time_minutes": 0,
            },
            {
                "name": "Menthol Drops",
                "description": "Cool and soothing mint-menthol throat soothers in hard candy form. Unit: 100-piece box — PKR 220/box.",
                "price": 220,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Chocolate Éclairs",
                "description": "Chewy caramel toffees filled with a rich chocolate-cream centre. Unit: 100-piece box — PKR 420/box.",
                "price": 420,
                "allergens": "Milk, Soy",
                "prep_time_minutes": 0,
            },
            {
                "name": "Fruit Drops",
                "description": "Assorted fruit-flavoured hard candies in mixed-fruit colours. Unit: 100-piece box — PKR 200/box.",
                "price": 200,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Tamarind Toffees",
                "description": "Tangy imli (tamarind) toffees with a sweet-sour punch — a local favourite. Unit: 100-piece box — PKR 200/box.",
                "price": 200,
                "allergens": None,
                "prep_time_minutes": 0,
            },
            {
                "name": "Happy Hearts Candies",
                "description": "Heart-shaped hard candies in assorted fruity flavours — ideal for gifting. Unit: 100-piece box — PKR 220/box.",
                "price": 220,
                "allergens": None,
                "prep_time_minutes": 0,
            },
        ],
    },

    # ── 8. CHOCOLATES ─────────────────────────────────────────────────────────
    "Chocolates": {
        "description": "Premium milk and dark chocolates, enrobed bars and chocolate boxes manufactured at Mitchell's world-class factory.",
        "items": [
            {
                "name": "Jubilee Milk Chocolate",
                "description": "Mitchell's iconic Jubilee milk chocolate bar — smooth, creamy and classic. Unit: 40g bar — PKR 80/bar.",
                "price": 80,
                "allergens": "Milk, Soy",
                "prep_time_minutes": 0,
            },
            {
                "name": "Happy Hearts Chocolate Box",
                "description": "Assorted milk chocolate box — perfect as a gift. Unit: 200g box — PKR 650/box.",
                "price": 650,
                "allergens": "Milk, Soy",
                "prep_time_minutes": 0,
            },
            {
                "name": "Chocolate Enrobed Biscuits",
                "description": "Crispy biscuit fingers fully coated in smooth milk chocolate. Unit: 200g pack — PKR 480/pack.",
                "price": 480,
                "allergens": "Milk, Gluten, Egg",
                "prep_time_minutes": 0,
            },
            {
                "name": "Moulded Chocolate Bar (Dark)",
                "description": "Rich dark chocolate bar with minimum 60% cocoa content. Unit: 80g bar — PKR 150/bar.",
                "price": 150,
                "allergens": "Milk, Soy",
                "prep_time_minutes": 0,
            },
            {
                "name": "Moulded Chocolate Bar (Milk)",
                "description": "Creamy moulded milk chocolate bar with a velvety texture. Unit: 80g bar — PKR 130/bar.",
                "price": 130,
                "allergens": "Milk, Soy",
                "prep_time_minutes": 0,
            },
        ],
    },
}


async def seed():
    from src.utils.db import init_db
    print("Initializing database tables...")
    await init_db()
    
    async with AsyncSessionLocal() as db:
        print("Clearing existing menu items and categories...")
        await db.execute(delete(MenuItem))
        await db.execute(delete(MenuCategory))
        await db.commit()
        
        print("Seeding new Mitchell's categories and products...")
        now = datetime.now(timezone.utc)
        
        for cat_index, (cat_name, cat_data) in enumerate(PRODUCT_CATALOG.items()):
            category = MenuCategory(
                id=str(uuid.uuid4()),
                name=cat_name,
                description=cat_data["description"],
                sort_order=cat_index + 1,
                is_available=True,
                created_at=now,
            )
            db.add(category)
            await db.flush()
            
            for item_index, item_data in enumerate(cat_data["items"]):
                item = MenuItem(
                    id=str(uuid.uuid4()),
                    category_id=category.id,
                    name=item_data["name"],
                    description=item_data["description"],
                    price=item_data["price"],
                    is_available=True,
                    allergens=item_data["allergens"],
                    prep_time_minutes=item_data["prep_time_minutes"],
                    sort_order=item_index + 1,
                    created_at=now,
                    updated_at=now,
                )
                db.add(item)
        
        await db.commit()
        total_items = sum(len(v["items"]) for v in PRODUCT_CATALOG.values())
        print(f"Successfully seeded {len(PRODUCT_CATALOG)} categories and {total_items} products into Mitchell's catalog!")

if __name__ == "__main__":
    asyncio.run(seed())
