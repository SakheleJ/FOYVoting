const SHEET_NAME = "Registrations";
const SHEET_ID   = "1kSp9eYz2Dur9JbBV-daM5AFVSdYxgpRmL8HmpDJUITY";
const FORM_URL   = "https://docs.google.com/forms/d/e/1FAIpQLSfruboI7hMpRtIm0wI5_0j_Z1hIQl5fqaXEHd6Jxd-P_4wLcA/viewform";
const FORM_FIELD = "entry.192582768"; // replace with your actual field


// ✅ SUBMIT HANDLER
function submitID(event) {
    if (event && event.preventDefault) {
        event.preventDefault();
    }

    const idField = document.getElementById("inputRegID");
    if (!idField) {
        console.error("Registration input not found");
        return;
    }

    let id = idField.value.trim();
    if (!id) {
        document.getElementById("idStatus").innerText = "Please enter your registration ID.";
        return;
    }

    google.script.run.withSuccessHandler(function (response) {
        if (response.success) {
            window.location.href = response.url;
        } else {
            document.getElementById("idStatus").innerText = response.message;
        }
    }).validateID(id);
    console.log("Sending ID:", id);
}


// ✅ MOD 11 VALIDATION (5-digit ID)
function isValidMod11(id) {
  if (!/^\d{5}$/.test(id)) return false;

  let digits = id.split('').map(Number);
  let checkDigit = digits[4];

  let sum = 0;
  let weight = 2;

  // Multiply first 4 digits from right to left
  for (let i = 3; i >= 0; i--) {
    sum += digits[i] * weight;
    weight++;
  }

  let remainder = sum % 11;
  let calculatedCheck = (11 - remainder) % 11;

  // Handle special cases (10 becomes 0 or invalid depending on your rule)
  if (calculatedCheck === 10) calculatedCheck = 0;

  return checkDigit === calculatedCheck;
}


// ✅ CHECK IF ID EXISTS IN SHEET
function isRegistered(id) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getRange("A2:C").getValues();

  for (let row of data) {
    if (row[0] == id && (row[2] === true || row[2] === "")) {
      return true;
    }
  }
  return false;
}


// ✅ WEB APP ENTRY POINT
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile("index");
}


// ✅ VALIDATION HANDLER
function validateID(id) {
  Logger.log("Received ID: " + id);
  if (!isValidMod11(id)) {
    return { success: false, message: "Invalid ID format (failed Mod 11 check)" };
  }

  if (!isRegistered(id)) {
    return { success: false, message: "ID not found on registration list" };
  }

  // Prefill Google Form
  let url = FORM_URL + "?" + FORM_FIELD + "=" + id;

  return { success: true, url: url };
}