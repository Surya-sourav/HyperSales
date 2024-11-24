import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import os
import sys

# Ensure that this script can be imported properly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class WebScraper:
    def __init__(self, base_url, max_depth=2):
        self.base_url = base_url
        self.max_depth = max_depth
        self.visited_urls = set()

    def scrape_site(self):
        """Start scraping from the base URL."""
        return self.scrape_page(self.base_url, 0)

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
    base_url = "https://example.com"
    scraper = WebScraper(base_url, max_depth=2)
    scraped_data = scraper.scrape_site()
    print(scraped_data)
