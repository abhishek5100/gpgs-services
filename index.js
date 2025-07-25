require("dotenv").config(); // Load .env variables
const express = require("express");
const cors = require("cors");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Parse the JSON string from .env
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

// Replace \n in private_key
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

const auth = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function fetchSheetData(spreadsheetId, sheetTitle) {
  try {
    const doc = new GoogleSpreadsheet(spreadsheetId, auth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) return [];

    const rows = await sheet.getRows();
    const headers = sheet.headerValues.map(h => h.replace(/\n/g, ' ').trim());

    const data = rows.map(row => {
      const rowData = {};
      headers.forEach((header, i) => {
        rowData[header] = row._rawData[i] || "";
      });
      return rowData;
    });

    return data;
  } catch (error) {
    console.error("Error fetching sheet:", error.message);
    return [];
  }
}

app.get("/google-sheet", async (req, res) => {
  const spreadsheetId = "1EUnGZWk9LWwAE-WIcYfOTpeQwnzy7AK3ct7_FTkbtxs";
  const sheetTitle = "Bedslist_gpgs";

  if (!spreadsheetId) {
    return res.status(400).json({ success: false, message: "Missing sheet ID" });
  }

  const data = await fetchSheetData(spreadsheetId, sheetTitle);
  console.log(11111111, data);
  
  res.json({ success: true, total: data.length, data });
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
