import urllib.request
import re

url = "https://diva-gis.org/data.html"
html = urllib.request.urlopen(url).read().decode('utf-8')
print("Fetched HTML")
