import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://localhost:8080/index.html')

        await asyncio.sleep(2)

        for i in range(0, 16, 2):
            await page.evaluate(f"pageFlip.turnToPage({i});")
            await asyncio.sleep(1)
            await page.screenshot(path=f'/home/jules/verification/spread_{i}.png', full_page=True)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
