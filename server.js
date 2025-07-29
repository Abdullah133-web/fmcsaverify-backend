const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/', async (req, res) => {
  const dotNumber = req.body.dotNumber;
  if (!dotNumber) return res.status(400).json({ error: 'DOT number required' });

  const url = `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_param=USDOT&query_string=${dotNumber}`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const content = await page.content();

    const legalNameMatch = content.match(/<b>Legal Name:<\/b>\s*(.*?)<br>/i);
    const statusMatch = content.match(/Operating Authority Status:<\/b>\s*(.*?)<br>/i);

    await browser.close();

    if (!legalNameMatch || !statusMatch) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    res.json({
      dot_number: dotNumber,
      legal_name: legalNameMatch[1].trim(),
      operating_status: statusMatch[1].trim(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
