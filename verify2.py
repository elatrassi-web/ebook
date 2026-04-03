import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        file_url = f"file://{os.path.abspath('index.html')}"
        print(f"Navigating to {file_url}")

        await page.goto(file_url)

        await asyncio.sleep(5)

        # Turn to a page where a Chapter starts (e.g. Chapter 2)
        await page.evaluate("window.pageFlip.turnToPage(16)")
        await asyncio.sleep(2)

        # Take a screenshot
        screenshot_path = '/home/jules/verification/chapter_title_page.png'
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
