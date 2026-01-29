let totalEnergy = 118;
let wastedEnergy = 22;
let costSaved = 850;
let co2Reduced = 15;

document.getElementById("totalEnergy").innerText = totalEnergy + " kWh";
document.getElementById("wastedEnergy").innerText = wastedEnergy + " kWh";
document.getElementById("costSaved").innerText = "₹" + costSaved;
document.getElementById("co2").innerText = co2Reduced + " kg";

if (wastedEnergy > 20) {
    document.getElementById("alertBox").style.display = "block";
} else {
    document.getElementById("alertBox").style.display = "none";
}
