const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxOvsAv-bXmDMrD7j754KklDeDcV2iYFE5XME70kLMY0-ohquD27M9HEUvoZUw0kYBYBw/exec";

let verifiedID         = null;
let verifiedName       = null;
let verifiedSurname    = null;
let verifiedPresbytery = null;


function loadVoteConfig() {
    const callbackName = "gsConfigCallback_" + Date.now();

    window[callbackName] = function(result) {
        if (result.success) {
            applyVoteConfig(result.config);
        }
        document.body.removeChild(script);
        delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `${APPS_SCRIPT_URL}?action=getVoteConfig&callback=${callbackName}`;
    document.body.appendChild(script);
}

function applyVoteConfig(config) {
    console.log("Applying config:", config);

    // Update title
    const titleEl = document.getElementById("voteTitle");
    if (titleEl && config.title) titleEl.textContent = config.title;

    // Update description
    const descEl = document.getElementById("voteDescription");
    if (descEl && config.description) descEl.textContent = config.description;

    // Update options
    const listGroup = document.querySelector("#voteFieldset .list-group");
    if (listGroup && config.options.length > 0) {
        listGroup.innerHTML = "";
        config.options.forEach(function(option) {
            const label = document.createElement("label");
            label.className = "list-group-item list-group-item-action";
            label.innerHTML = `
                <input class="form-check-input me-2" type="radio" name="presbytery" value="${option}">
                ${option}
            `;
            listGroup.appendChild(label);
        });
    }
}

function submitID() {
    const id         = document.getElementById("inputRegID").value.trim();
    const name       = document.getElementById("inputName").value.trim();
    const surname    = document.getElementById("inputSurname").value.trim();
    const presbytery = document.getElementById("selectPresbytery").value;
    const statusEl   = document.getElementById("idStatus");
    // Ensure aria-live for accessibility
    statusEl.setAttribute("aria-live", "polite");
    const verifyBtn  = document.getElementById("verifyBtn");

    if (!/^\d{5}$/.test(id)) {
        statusEl.textContent = "Please enter a valid 5-digit ID.";
        statusEl.className = "form-text text-danger";
        return;
    }
    if (!name) {
        statusEl.textContent = "Please enter your Name.";
        statusEl.className = "form-text text-danger";
        return;
    }
    if (!surname) {
        statusEl.textContent = "Please enter your Surname.";
        statusEl.className = "form-text text-danger";
        return;
    }
    if (!presbytery) {
        statusEl.textContent = "Please select your Presbytery.";
        statusEl.className = "form-text text-danger";
        return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifying...";
    statusEl.textContent = "Verifying your details, please wait...";
    statusEl.className = "form-text text-muted";

    const callbackName = "gsCallback_" + Date.now();

    window[callbackName] = function(result) {
        if (result.success) {
            // Store all verified details for use during vote submission
            verifiedID         = id;
            verifiedName       = name;
            verifiedSurname    = surname;
            verifiedPresbytery = presbytery;

            statusEl.innerHTML = '✅ ID Verified!<span class="visually-hidden">ID Verified!</span>';
            statusEl.className = "form-text text-success";

            // Show credentials badge next to the ID input
            const existingBadge = document.getElementById("credentialsBadge");
            if (existingBadge) existingBadge.remove();

            const badge = document.createElement("span");
            badge.id = "credentialsBadge";
            badge.className = "badge bg-success mt-2 d-block";
            badge.textContent = result.credentials || "No credentials found";

            const idInput = document.getElementById("inputRegID");
            idInput.parentNode.insertBefore(badge, idInput.nextSibling);

            showVotingSection(result.hasVoted);
        } else {
            statusEl.innerHTML = '❌ ' + result.message +' <span class="visually-hidden">' + result.message +'</span>';
            statusEl.className = "form-text text-danger";
            verifyBtn.disabled = false;
            verifyBtn.textContent = "Verify";
        }

        document.body.removeChild(script);
        delete window[callbackName];
    };

    const script = document.createElement("script");
    console.log("Sending presbytery:", presbytery);
console.log("Full URL:", `${APPS_SCRIPT_URL}?id=${encodeURIComponent(id)}&presbytery=${encodeURIComponent(presbytery)}&callback=${callbackName}`);

document.body.appendChild(script);
    script.src = `${APPS_SCRIPT_URL}?id=${encodeURIComponent(id)}&presbytery=${encodeURIComponent(presbytery)}&callback=${callbackName}`;
    script.onerror = function() {
        statusEl.textContent = "⚠️ Network error. Please try again.";
        statusEl.className = "form-text text-danger";
        verifyBtn.disabled = false;
        verifyBtn.textContent = "Verify";
        document.body.removeChild(script);
        delete window[callbackName];
    };

    document.body.appendChild(script);
}

function showVotingSection(hasVoted) {
    document.getElementById("registrationFieldset").querySelectorAll("input, select, button").forEach(el => el.disabled = true);
    document.getElementById("registrationFieldset").style.opacity = "0.5";
    document.getElementById("verifyBtn").style.display = "none";
    document.getElementById("voteFieldset").style.display = "block";

    if (hasVoted) {
        // Hide voting options and show already voted message
        document.querySelector("#voteFieldset .list-group").style.display = "none";
        document.getElementById("voteBtn").style.display = "none";
        document.getElementById("voteStatus").innerHTML = `
                <div class="alert alert-warning">
                    ⚠️ Our records show that you have already submitted a vote. 
                    If you believe this is an error, please contact the administrator.
                </div>
            `;
    }
}


function submitVote() {
    const selected   = document.querySelector('input[name="presbytery"]:checked');
    const voteStatus = document.getElementById("voteStatus");
    const voteBtn    = document.getElementById("voteBtn");

    console.log("verifiedID:", verifiedID);  //debug only
    console.log("selected:", selected);  //debug only
    console.log("selected value:", selected ? selected.value : "nothing selected");   //debug only


    if (!verifiedID) {
        voteStatus.innerHTML = '<div class="alert alert-danger">❌ Session error. Please refresh and verify again.</div>';
        return;
    }

    if (!selected) {
        voteStatus.innerHTML = '<div class="alert alert-warning">⚠️ Please select a presbytery before submitting.</div>';
        return;
    }

    const vote = selected.value;
    console.log("Submitting vote:", vote);  //debug only
    console.log("Full URL:", `${APPS_SCRIPT_URL}?id=${encodeURIComponent(verifiedID)}&name=${encodeURIComponent(verifiedName)}&surname=${encodeURIComponent(verifiedSurname)}&presbytery=${encodeURIComponent(verifiedPresbytery)}&vote=${encodeURIComponent(vote)}&callback=DEBUG`);   //debug only

    voteBtn.disabled = true;
    voteBtn.textContent = "Submitting...";
    voteStatus.innerHTML = '<div class="alert alert-info">Submitting your vote, please wait...</div>';

    const callbackName = "gsVoteCallback_" + Date.now();

    window[callbackName] = function(result) {
        if (result.success) {
            voteStatus.innerHTML = '<div class="alert alert-success">✅ ' + result.message + '</div>';
            voteBtn.textContent = "Vote Submitted";
            voteBtn.disabled = true;
        } else {
            voteStatus.innerHTML = '<div class="alert alert-danger">❌ ' + result.message + '</div>';
            voteBtn.disabled = false;
            voteBtn.textContent = "Submit Vote";
        }

        document.body.removeChild(script);
        delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `${APPS_SCRIPT_URL}?id=${encodeURIComponent(verifiedID)}&name=${encodeURIComponent(verifiedName)}&surname=${encodeURIComponent(verifiedSurname)}&presbytery=${encodeURIComponent(verifiedPresbytery)}&vote=${encodeURIComponent(vote)}&callback=${callbackName}`;
    script.onerror = function() {
        voteStatus.innerHTML = '<div class="alert alert-danger">⚠️ Network error. Please try again.</div>';
        voteBtn.disabled = false;
        voteBtn.textContent = "Submit Vote";
        document.body.removeChild(script);
        delete window[callbackName];
    };

    document.body.appendChild(script);
};


// Load vote config as soon as the page loads
document.addEventListener("DOMContentLoaded", function() {
    loadVoteConfig();
});