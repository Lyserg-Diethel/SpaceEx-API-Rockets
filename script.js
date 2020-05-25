const successOverlay = document.querySelector('.successOverlay');
const successPopup = document.querySelector('.successPopup');
const popupNote = document.querySelector('.popupNote');
const restartBtn = document.querySelector('.restartBtn');
const startBtn = document.querySelector('.startBtn');
const timeouts = [];
let launchPad = document.querySelector('.launchPad');
let rocketGameStatsArray = [];
let rocketTracker = {};
let totalLaunchPrice = 0;
let rocketsStillFying = 0;

class Rocket{
	constructor(id, name, stageOneFuel = 0, stageTwoFuel = 0,){
		this.id = id,
		this.name = name,
		this.stageOneFuel = stageOneFuel,
		this.stageTwoFuel = stageTwoFuel,
		this.flightLength = (stageOneFuel + stageTwoFuel)
	}
	trackFuel(){ //Called repeatedly for each rocket to track stages and remaining fuel.
		if(!rocketTracker[`${this.id}componentsHolder`]){
			rocketTracker[`${this.id}componentsHolder`] = document.querySelector(`.${this.id}componentsHolder`);
		}
		let rocketHolder = rocketTracker[`${this.id}componentsHolder`]
		let rocketDataset = rocketHolder.dataset;
		let stageOneFuel = rocketDataset.stageOneFuel;
		let stageOneEndTime = rocketDataset.stageOneFuelDate;
		let totalFuel = rocketDataset.totalFuel;
		let totalFuelDate = rocketDataset.totalFuelDate;
		let currentTime = new Date();

		if(stageOneEndTime - currentTime > 0){//If there's still fuel left in stage one:
			stageOneFuel = ((stageOneEndTime - (currentTime*1))/1000).toFixed(2); //reduce remaining fuel in stage 1.
			rocketDataset.totalFuel = ((totalFuelDate - (currentTime*1))/1000).toFixed(2); //reduce total remaining fuel.
			totalFuel = rocketDataset.totalFuel;

			if(stageOneEndTime - currentTime < 1000){ //If there's less than one second of fuel left, call the next tracking iteration sooner.
				timeouts.push(setTimeout(function(){
					rocketHolder.rocketData.trackFuel()
				}.bind(this), (stageOneEndTime - currentTime)));

				stageOneFuel = 0;
				rocketDataset.stageOneFuelDate = currentTime;
			}else{ //Schedule the next tracking iteration.
				timeouts.push(setTimeout(function(){
				rocketHolder.rocketData.trackFuel()
				}.bind(this), 1000));
			}
		}else if(totalFuelDate - (currentTime*1) > 0){//if there's stage two fuel left, hide stage 1 and:
			rocketHolder.children[1].classList.add('notDisplayed');
			
			rocketDataset.totalFuel = ((totalFuelDate - (currentTime*1))/1000).toFixed(2);
			totalFuel = rocketDataset.totalFuel;
			if(totalFuel <= 0){ //If all fuel is spent, hide the rocket
				rocketHolder.classList.add('notDisplayed');
			}
			if(totalFuel < 1 && totalFuel > 0){ //If there's less than one second of fuel left, call the next tracking iteration sooner.
				timeouts.push(setTimeout(function(){
					rocketHolder.rocketData.trackFuel()
				}.bind(this), (totalFuelDate - currentTime)));
				rocketDataset.stageTwoFuel = 0;
			}else{ //Schedule the next tracking iteration.
				timeouts.push(setTimeout(function(){
					rocketHolder.rocketData.trackFuel()
				}.bind(this), 1000));
			}
		}else{ //If all fuel is spent, hide the rocket and note if there's any rockets left. In not, show the Game Over screen.
			rocketHolder.classList.add('notDisplayed');
			rocketsStillFying -= 1;
			if(rocketsStillFying <= 0){
				gameOver();
			}
		}
	}
}

const clearTimeouts = function(){
	for(let i = 0; i<timeouts.length; i+=1){
		clearTimeout(timeouts[i]);
	}
}
const resetGameState = ()=>{
	launchPad.innerHTML = '';
	rocketGameStatsArray = [];
	successOverlay.classList.add('notDisplayed');
	successPopup.classList.add('notDisplayed');
	totalLaunchPrice = 0;
	rocketTracker = {};
}
const startGame = ()=>{
	let jsonStorage = [];
	clearTimeouts();
	resetGameState();
	startBtn.classList.add("notDisplayed");

	fetch("https://api.spacexdata.com/v2/rockets")
	.then(function(response) {
		return response.text();
	})
	.then(function(responseText){
		jsonStorage = JSON.parse(responseText);
		populateRocketArr(jsonStorage);
	})
}
const populateRocketArr = function(jsonStorage){
	for(let obj of jsonStorage){
		rocketGameStatsArray.push(new Rocket(obj.id, obj.name, obj.first_stage.fuel_amount_tons, obj.second_stage.fuel_amount_tons));
		rocketsStillFying += 1;
		totalLaunchPrice += obj.cost_per_launch;
	}
	createRockets(rocketGameStatsArray);
}
const createRockets = function(rocketGameStatsArray){
	for(let rocket of rocketGameStatsArray){
		let componentsHolder = document.createElement('div');
		let stageTwoHolder = document.createElement('div');
		let stageOneHolder = document.createElement('div');
		let rocketDataset = componentsHolder.dataset;

		componentsHolder.appendChild(stageTwoHolder);
		stageTwoHolder.innerHTML = "<img src='assets/rocket_top.png'></img>";
		stageTwoHolder.classList.add(`${rocket.id}StageTwoHolder`, 'stageTwoHolder');

		componentsHolder.appendChild(stageOneHolder);
		stageOneHolder.innerHTML = "<img src='assets/rocket_bottom.png'></img>"
		stageOneHolder.classList.add(`${rocket.id}StageOneHolder`); //Currently not in use.

		componentsHolder.classList.add(`${rocket.id}componentsHolder`, 'componentsHolder');
		rocketDataset.stageOneFuel = rocket.stageOneFuel;
		rocketDataset.stageTwoFuel = rocket.stageTwoFuel;
		rocketDataset.stageOneFuelDate = (new Date()*1) + (rocketDataset.stageOneFuel * 1000);
		rocketDataset.totalFuel = rocket.stageTwoFuel + rocket.stageOneFuel;
		rocketDataset.totalFuelDate = (new Date()*1) + (rocketDataset.totalFuel * 1000);
		componentsHolder.rocketData = rocket;
		
		launchPad.appendChild(componentsHolder);
	}
	launchRockets(rocketGameStatsArray);
}
const launchRockets = function(rocketGameStatsArray){
	for(let rocket of rocketGameStatsArray){
		const rocketDiv = document.querySelector(`.${rocket.id}componentsHolder`);
		rocketDiv.style.animation = `fly ${rocket.flightLength}s linear`;
		rocket.trackFuel();
	}
}
const gameOver= function(){
	successOverlay.classList.remove('notDisplayed');
	popupNote.textContent = `Success! This little maneuvre cost us $${totalLaunchPrice}. Want to go again?`;
	successPopup.classList.remove('notDisplayed');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

document.addEventListener('keyup', event=> {
	if((event.keyCode === 13) && successOverlay.classList.contains('notDisplayed')){
		startGame();
	}else{
		successOverlay.classList.add('notDisplayed');
		successPopup.classList.add('notDisplayed');
	}
});