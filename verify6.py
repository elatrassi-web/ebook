import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://localhost:8080/index.html')

        await asyncio.sleep(2)

        # Flip to page index 12
        await page.evaluate("pageFlip.flip(12);")
        await asyncio.sleep(2)
        await page.screenshot(path='/home/jules/verification/page_12_13.png', full_page=True)

        # Flip to page index 14
        await page.evaluate("pageFlip.flip(14);")
        await asyncio.sleep(2)
        await page.screenshot(path='/home/jules/verification/page_14_15.png', full_page=True)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
