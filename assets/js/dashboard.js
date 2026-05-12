const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxOvsAv-bXmDMrD7j754KklDeDcV2iYFE5XME70kLMY0-ohquD27M9HEUvoZUw0kYBYBw/exec";

let adminID  = null;
let barChart = null;
let votesPieChart = null;

function login() {
    const id        = document.getElementById("adminID").value.trim();
    const statusEl  = document.getElementById("loginStatus");
    const loginBtn  = document.getElementById("loginBtn");

    if (!/^\d{5}$/.test(id)) {
        statusEl.textContent = "Please enter a valid 5-digit ID.";
        statusEl.className = "form-text text-danger";
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Verifying...";
    statusEl.textContent = "Checking access...";
    statusEl.className = "form-text text-muted";

    const callbackName = "gsLoginCallback_" + Date.now();

    window[callbackName] = function(result) {
        if (result.success) {
            adminID = id;
            document.getElementById("loginSection").style.display = "none";
            document.getElementById("dashboardSection").style.display = "block";
            document.getElementById("navStatus").textContent = "Admin: " + id;
            renderDashboard(result);
        } else {
            statusEl.textContent = "❌ " + result.message;
            statusEl.className = "form-text text-danger";
            loginBtn.disabled = false;
            loginBtn.textContent = "Access Dashboard";
        }

        document.body.removeChild(script);
        delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `${APPS_SCRIPT_URL}?action=getDashboard&id=${encodeURIComponent(id)}&callback=${callbackName}`;
    script.onerror = function() {
        statusEl.textContent = "⚠️ Network error. Please try again.";
        statusEl.className = "form-text text-danger";
        loginBtn.disabled = false;
        loginBtn.textContent = "Access Dashboard";
        document.body.removeChild(script);
        delete window[callbackName];
    };

    document.body.appendChild(script);
}

function refreshDashboard() {
    if (!adminID) return;

    const callbackName = "gsRefreshCallback_" + Date.now();

    window[callbackName] = function(result) {
        if (result.success) {
            renderDashboard(result);
        }
        document.body.removeChild(script);
        delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `${APPS_SCRIPT_URL}?action=getDashboard&id=${encodeURIComponent(adminID)}&callback=${callbackName}`;
    document.body.appendChild(script);
}

function renderDashboard(result) {
    console.log("Dashboard result:", result);
    renderRegistrationTable(result.registration);
    renderVotingResults(result.voting);
    renderFormResults(result.formResults);
        if (result.formResults) {
        renderFormResults(result.formResults);
        } else {
        console.log("formResults missing from response");  // debbug
    }
}

function renderRegistrationTable(data) {
    const tbody = document.getElementById("regTableBody");
    const tfoot = document.getElementById("regTableFoot");

    let totalDelegates     = 0;
    let totalAssociates    = 0;
    let totalOther         = 0;
    let totalAttendees     = 0;
    let totalCongregations = 0;

    tbody.innerHTML = "";

    data.forEach(row => {
        totalDelegates     += row.delegates;
        totalAssociates    += row.associates;
        totalOther         += row.other;
        totalAttendees     += row.total;
        totalCongregations += row.congregations;

        tbody.innerHTML += `
            <tr>
                <td>${row.presbytery}</td>
                <td>${row.delegates}</td>
                <td>${row.associates}</td>
                <td>${row.other}</td>
                <td><strong>${row.total}</strong></td>
                <td>${row.congregations}</td>
            </tr>
        `;
    });

    tfoot.innerHTML = `
        <tr>
            <td>TOTAL</td>
            <td>${totalDelegates}</td>
            <td>${totalAssociates}</td>
            <td>${totalOther}</td>
            <td>${totalAttendees}</td>
            <td>${totalCongregations}</td>
        </tr>
    `;
}

function renderVotingResults(voting) {
    const totalRegistered   = voting.totalRegistered;
    const totalVotes        = voting.totalVotes;
    const notVoted          = voting.didNotVote;
    const rate              = totalRegistered > 0 ? ((totalVotes / totalRegistered) * 100).toFixed(1) + "%" : "0%";
    
    if (document.getElementById("statTotal"))    
        document.getElementById("statTotal").textContent  = totalRegistered;
    if (document.getElementById("statVoted"))     
        document.getElementById("statVoted").textContent  = totalVotes;
    if (document.getElementById("statNotVoted"))       
        document.getElementById("statNotVoted").textContent = notVoted;
    if (document.getElementById("formStatRate"))           
        document.getElementById("formStatRate").textContent = rate;

    const labels = Object.keys(voting.voteMap);
    const values = Object.values(voting.voteMap);
    const colors = [
        "#0d6efd", "#198754", "#dc3545", "#ffc107",
        "#0dcaf0", "#6f42c1", "#fd7e14", "#20c997"
    ];

    // // Bar Chart
    // if (barChart) barChart.destroy();
    // barChart = new Chart(document.getElementById("barChart"), {
    //     type: "bar",
    //     data: {
    //         labels: labels,
    //         datasets: [{
    //             label: "Votes",
    //             data: values,
    //             backgroundColor: colors.slice(0, labels.length)
    //         }]
    //     },
    //     options: {
    //         responsive: true,
    //         plugins: { legend: { display: false } },
    //         scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    //     }
    // });

    // Pie Chart — Voted vs Did Not Vote
    // if (pieChart) pieChart.destroy();
    // pieChart = new Chart(document.getElementById("pieChart"), {
    //     type: "pie",
    //     data: {
    //         labels: ["Voted", "Did Not Vote"],
    //         datasets: [{
    //             data: [voting.totalVotes, voting.didNotVote],
    //             backgroundColor: ["#198754", "#dc3545"]
    //         }]
    //     },
    //     options: {
    //         responsive: true,
    //         plugins: {
    //             legend: { position: "bottom" },
    //             tooltip: {
    //                 callbacks: {
    //                     label: function(context) {
    //                         const total = voting.totalRegistered;
    //                         const value = context.parsed;
    //                         const pct   = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    //                         return `${context.label}: ${value} (${pct}%)`;
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // });
}

let optionBarChart  = null;
let optionPieChart  = null;
let presbyBarChart  = null;
let presbyPieChart  = null;

const CHART_COLORS = [
    "#0d6efd", "#198754", "#dc3545", "#ffc107",
    "#0dcaf0", "#6f42c1", "#fd7e14", "#20c997",
    "#adb5bd", "#d63384"
];

function renderFormResults(data) {
    const totalVotes      = data.totalVotes;
    const totalRegistered = data.totalRegistered;
    const didNotVote       = totalRegistered - totalVotes;
    // const rate            = totalRegistered > 0 ? ((totalVotes / totalRegistered) * 100).toFixed(1) + "%" : "0%";

    // document.getElementById("formStatTotal").textContent     = totalVotes;
    // document.getElementById("formStatRate").textContent      = rate;
    // document.getElementById("formStatAbstained").textContent = abstained;

    // --- Votes per option table ---
    const optionBody = document.getElementById("voteOptionTableBody");
    const optionFoot = document.getElementById("voteOptionTableFoot");
    optionBody.innerHTML = "";

    const optionLabels = data.allOptions;
    const optionValues = optionLabels.map(opt => data.voteByOption[opt] || { total: 0, delegates: 0, associates: 0, other: 0 });

    optionLabels.forEach((opt, i) => {
        const row = optionValues[i];
        const pct = totalVotes > 0 ? ((row.total / totalVotes) * 100).toFixed(1) : 0;
        optionBody.innerHTML += `
            <tr>
                <td>${opt}</td>
                <td><strong>${row.total}</strong></td>
                <td>${row.delegates}</td>
                <td>${row.associates}</td>
                <td>${row.other}</td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar bg-primary" style="width: ${pct}%">${pct}%</div>
                    </div>
                </td>
            </tr>
        `;
    });

    optionFoot.innerHTML = `
        <tr>
            <td>TOTAL</td>
            <td>${totalVotes}</td>
            <td>${optionValues.reduce((s, r) => s + r.delegates, 0)}</td>
            <td>${optionValues.reduce((s, r) => s + r.associates, 0)}</td>
            <td>${optionValues.reduce((s, r) => s + r.other, 0)}</td>
            <td>100%</td>
        </tr>
    `;

    // --- Votes Pie Char ---
    if (votesPieChart) votesPieChart.destroy();
    votesPieChart = new Chart(document.getElementById("votesPieChart"), {
        type: "pie",
        data: {
            labels: ["Voted", "Did Not Vote"],
            datasets: [{
                data: [totalVotes, didNotVote],
                backgroundColor: ["#198754", "#dc3545"]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = totalRegistered;
                            const value = context.parsed;
                            const pct   = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${value} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    // --- Option charts ---
    if (optionBarChart) optionBarChart.destroy();
    optionBarChart = new Chart(document.getElementById("optionBarChart"), {
        type: "bar",
        data: {
            labels: optionLabels,
            datasets: [{
                label: "Votes",
                data: optionValues.map(r => r.total),
                backgroundColor: CHART_COLORS.slice(0, optionLabels.length)
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    if (optionPieChart) optionPieChart.destroy();
    optionPieChart = new Chart(document.getElementById("optionPieChart"), {
        type: "pie",
        data: {
            labels: optionLabels,
            datasets: [{
                data: optionValues.map(r => r.total),
                backgroundColor: CHART_COLORS.slice(0, optionLabels.length)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const pct = totalVotes > 0 ? ((context.parsed / totalVotes) * 100).toFixed(1) : 0;
                            return `${context.label}: ${context.parsed} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    // --- Votes per presbytery table ---
    const presbyBody = document.getElementById("votePresbyTableBody");
    const presbyFoot = document.getElementById("votePresbyTableFoot");
    presbyBody.innerHTML = "";

    const presbyLabels = data.allPresbyteries;
    const presbyValues = presbyLabels.map(p => data.voteByPresbytery[p] || { total: 0, delegates: 0, associates: 0, other: 0 });

    presbyLabels.forEach((p, i) => {
        const row = presbyValues[i];
        const pct = totalVotes > 0 ? ((row.total / totalVotes) * 100).toFixed(1) : 0;
        presbyBody.innerHTML += `
            <tr>
                <td>${p}</td>
                <td><strong>${row.total}</strong></td>
                <td>${row.delegates}</td>
                <td>${row.associates}</td>
                <td>${row.other}</td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar bg-success" style="width: ${pct}%">${pct}%</div>
                    </div>
                </td>
            </tr>
        `;
    });

    presbyFoot.innerHTML = `
        <tr>
            <td>TOTAL</td>
            <td>${totalVotes}</td>
            <td>${presbyValues.reduce((s, r) => s + r.delegates, 0)}</td>
            <td>${presbyValues.reduce((s, r) => s + r.associates, 0)}</td>
            <td>${presbyValues.reduce((s, r) => s + r.other, 0)}</td>
            <td>100%</td>
        </tr>
    `;

    // --- Presbytery charts ---
    if (presbyBarChart) presbyBarChart.destroy();
    presbyBarChart = new Chart(document.getElementById("presbyBarChart"), {
        type: "bar",
        data: {
            labels: presbyLabels,
            datasets: [{
                label: "Votes",
                data: presbyValues.map(r => r.total),
                backgroundColor: CHART_COLORS.slice(0, presbyLabels.length)
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    if (presbyPieChart) presbyPieChart.destroy();
    presbyPieChart = new Chart(document.getElementById("presbyPieChart"), {
        type: "pie",
        data: {
            labels: presbyLabels,
            datasets: [{
                data: presbyValues.map(r => r.total),
                backgroundColor: CHART_COLORS.slice(0, presbyLabels.length)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const pct = totalVotes > 0 ? ((context.parsed / totalVotes) * 100).toFixed(1) : 0;
                            return `${context.label}: ${context.parsed} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function togglePresbyChart(type) {
    const barWrapper = document.getElementById("presbyBarWrapper");
    const pieWrapper = document.getElementById("presbyPieWrapper");
    const barBtn     = document.getElementById("barToggleBtn");
    const pieBtn     = document.getElementById("pieToggleBtn");

    if (type === "bar") {
        barWrapper.style.display = "block";
        pieWrapper.style.display = "none";
        barBtn.className = "btn btn-primary btn-sm active";
        pieBtn.className = "btn btn-outline-primary btn-sm";
    } else {
        barWrapper.style.display = "none";
        pieWrapper.style.display = "block";
        barBtn.className = "btn btn-outline-primary btn-sm";
        pieBtn.className = "btn btn-primary btn-sm active";
    }
}