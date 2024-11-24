import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import os
import sys
from pymongo import MongoClient
from bson import ObjectId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# MongoDB Connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = MongoClient(MONGODB_URI)
db = client["chatbot_db"]
knowledge_collection = db["knowledge"]

# Define FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    user_id: str
    website_url: str

@app.post("/scrape")
async def scrape_website(request: ScrapeRequest):
    """Endpoint to scrape a website and store the data."""
    scraper = WebScraper(base_url=request.website_url, user_id=request.user_id)
    scraped_data = scraper.scrape_site()

    if not scraped_data:
        raise HTTPException(status_code=500, detail="Failed to scrape the website")

    return {"message": "Website scraped successfully", "scraped_data": scraped_data}

class WebScraper:
    def __init__(self, base_url, max_depth=2, user_id=None):
        self.base_url = base_url
        self.max_depth = max_depth
        self.visited_urls = set()
        self.user_id = user_id

    def scrape_site(self):
        """Start scraping from the base URL."""
        scraped_data = self.scrape_page(self.base_url, 0)
        if scraped_data:
            self.store_data(scraped_data)
        return scraped_data

    def scrape_page(self, url, depth):
        """Recursively scrape a page and follow links up to the specified depth."""
        if depth > self.max_depth or url in self.visited_urls:
            return None

        self.visited_urls.add(url)
        print(f"Scraping: {url} at depth {depth}")

        try:
            response = requests.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            # Scrape main content
            page_data = {
                "url": url,
                "title": soup.title.string if soup.title else "No Title",
                "meta": self.get_all_meta(soup),
                "headings": self.get_all_headings(soup),
                "links": [],
                "images": self.get_all_images(soup),
                "text": self.get_all_text(soup)
            }

            # Process all links and recursively scrape
            links = self.get_all_links(soup, url)
            for link in links:
                page_data["links"].append(link)
                link_url = link['url']
                if link_url not in self.visited_urls:
                    child_data = self.scrape_page(link_url, depth + 1)
                    if child_data:
                        page_data.setdefault("child_pages", []).append(child_data)

            return page_data
        except requests.exceptions.RequestException as e:
            print(f"Error while scraping {url}: {e}")
            return None

    def store_data(self, scraped_data):
        """Store the scraped data in the knowledge collection."""
        knowledge_entry = {
            "user_id": self.user_id,
            "web_url": self.base_url,
            "scraped_data": scraped_data
        }
        knowledge_collection.insert_one(knowledge_entry)
        print("Scraped data stored successfully.")

    def get_all_meta(self, soup):
        meta_data = {}
        for tag in soup.find_all("meta"):
            if tag.get("name"):
                meta_data[tag.get("name")] = tag.get("content", "")
            elif tag.get("property"):
                meta_data[tag.get("property")] = tag.get("content", "")
        return meta_data

    def get_all_headings(self, soup):
        headings = {}
        for level in range(1, 7):
            tag = f"h{level}"
            headings[tag] = [h.get_text(strip=True) for h in soup.find_all(tag)]
        return headings

    def get_all_links(self, soup, base_url):
        links = []
        for link in soup.find_all("a", href=True):
            full_url = urljoin(base_url, link["href"])
            if urlparse(full_url).netloc == urlparse(self.base_url).netloc:  # Compare against base_url
                links.append({
                    "text": link.get_text(strip=True),
                    "url": full_url
                })
        return links

    def get_all_images(self, soup):
        images = []
        for img in soup.find_all("img", src=True):
            images.append({
                "src": urljoin(self.base_url, img["src"]),  # Ensure absolute URL for images
                "alt": img.get("alt", "No alt text")
            })
        return images

    def get_all_text(self, soup):
        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()
        return " ".join(soup.stripped_strings)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
