import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1200, "height": 800})
        await page.goto("http://localhost:8080")

        # Wait for initialization
        await asyncio.sleep(1)

        # Turn to page 13 (index 12 or 13)
        await page.evaluate("""
            const st = window.pageFlip;
            if (st) {
                st.turnToPage(12);
            }
        """)
        await asyncio.sleep(1)
        await page.screenshot(path="/home/jules/verification/chapter_2_verified_12.png")

        await browser.close()

asyncio.run(main())
