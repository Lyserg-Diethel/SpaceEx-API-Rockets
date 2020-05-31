const successOverlay = document.querySelector('.successOverlay');
const successPopup = document.querySelector('.successPopup');
const popupNote = document.querySelector('.popupNote');
const restartBtn = document.querySelector('.restartBtn');
const startBtn = document.querySelector('.startBtn');
const launchPad = document.querySelector('.launchPad');
const timeouts = [];
let jsonStorage = [];
let totalLaunchPrice = 0;
let rocketsStillFying = 0;

class Rocket{
	constructor(id, stageOneFuel = 0, stageTwoFuel = 0){
		this.id = id;
		this.stageOneFuel = stageOneFuel,
		this.stageOneFuelDate = (new Date()*1) + (this.stageOneFuel * 1000);
		this.stageTwoFuel = stageTwoFuel;
		this.stageTwoFuelDate = (new Date()*1) + (this.stageTwoFuel * 1000);
		this.totalFuel = (stageOneFuel + stageTwoFuel);
		this.RocketInDOM = this.buildRocket();
	}
	trackFuel(){ //Called repeatedly for each rocket to track stages and remaining fuel.

		let rocketDomContainer = this.RocketInDOM;
		let rocketDataset = rocketDomContainer.dataset;
		let currentTime = new Date();

		if(this.hasStageOneFuelLeft(currentTime)){
			this.spendFuel(currentTime, rocketDataset);

			this.stageIsEndingSoon(currentTime) ?
				this.scheduleStageEnd(currentTime, rocketDataset) :
				this.checkFuelInOneSecond();

		}else if(this.hasStageTwoFuelLeft(currentTime)){

			this.hideStageOne(rocketDomContainer);
			this.spendFuel(currentTime, rocketDataset, 'stageTwo');

			this.stageIsEndingSoon(currentTime, 'stageTwoFuelDate') ?
				this.scheduleStageEnd(currentTime, rocketDataset, 'stageTwoFuel') :
				this.checkFuelInOneSecond();

		}else{ //If all fuel is spent.
			this.hideRocket(rocketDomContainer);
			this.checkEndGame();
		}

	}
	hasStageOneFuelLeft(currentTime){
		return (this.stageOneFuelDate - currentTime > 0 ? true : false);
	}
	hasStageTwoFuelLeft(currentTime){
		return (this.stageTwoFuelDate - currentTime) > 0 ? true : false;
	}
	stageIsEndingSoon(currentTime, fuelDate = 'stageOneFuelDate'){
		return (this[fuelDate] - currentTime < 1000 ? true : false);
	}

	spendFuel(currentTime, rocketDataset, stage = 'stageOne'){
			let stageIndicator = stage === 'stageOne'? '1' : '2';

			this[`${stage}Fuel`] = ((this[`${stage}FuelDate`] - currentTime*1)/1000);
			rocketDataset.currentStageFuel = `${this[`${stage}Fuel`].toFixed(2)} | ${stageIndicator}`;
	}

	scheduleStageEnd(currentTime, rocketDataset, stageFuel = 'stageOneFuel'){
		timeouts.push(setTimeout(function(){
			this.trackFuel()
		}.bind(this), (this[`${stageFuel}Date`] - currentTime)));

		this[stageFuel] = 0;

		if(this.stageOneFuel === 0){
			this.stageTwoFuelDate = (new Date()*1) + (this.stageTwoFuel * 1000);
		}
	}
	checkFuelInOneSecond(){
		timeouts.push(setTimeout(function(){
			this.trackFuel()
		}.bind(this), 1000));
	}
	hideStageOne(rocketDomContainer){
		rocketDomContainer.children[1].classList.add('notDisplayed');
	}
	hideRocket(rocketDomContainer){
		rocketDomContainer.classList.add('notDisplayed');
	}
	checkEndGame(){
		rocketsStillFying -= 1;
		if(rocketsStillFying <= 0){
			gameOver();
		}
	}
	buildRocket(){
		let componentsHolder = document.createElement('div');
		let stageTwoHolder = document.createElement('div');
		let stageOneHolder = document.createElement('div');

		this.buildStageTwo(componentsHolder, stageTwoHolder);
		this.buildStageOne(componentsHolder, stageOneHolder);
		this.assignRocketToDOM(componentsHolder);
		return componentsHolder;
	}
	buildStageOne(componentsHolder, stageOneHolder){
		componentsHolder.appendChild(stageOneHolder);
		stageOneHolder.innerHTML = "<img src='assets/rocket_bottom.png'></img>"
		stageOneHolder.classList.add(`${this.id}StageOneHolder`);
	}
	buildStageTwo(componentsHolder, stageTwoHolder){
		componentsHolder.appendChild(stageTwoHolder);
		stageTwoHolder.innerHTML = "<img src='assets/rocket_top.png'></img>";
		stageTwoHolder.classList.add(`${this.id}StageTwoHolder`, 'stageTwoHolder');
	}
	assignRocketToDOM(componentsHolder){
		componentsHolder.classList.add(`${this.id}componentsHolder`, 'componentsHolder');
		launchPad.appendChild(componentsHolder);
	}
	launchRocket(){
		this.RocketInDOM.style.animation = `fly ${this.totalFuel}s linear`;
		this.trackFuel();
	}
}
const clearTimeouts = function(){
	for(let i = 0; i<timeouts.length; i+=1){
		clearTimeout(timeouts[i]);
	}
}
const resetGameState = ()=>{
	launchPad.innerHTML = '';
	successOverlay.classList.add('notDisplayed');
	successPopup.classList.add('notDisplayed');
	totalLaunchPrice = 0;
	rocketsStillFying = 0;
}
const startGame = ()=>{
	clearTimeouts();
	resetGameState();
	startBtn.classList.add("notDisplayed");

	fetch("https://api.spacexdata.com/v2/rockets")
	.then(response => {
		return response.text();
	})
	.then(responseText => {
		jsonStorage = JSON.parse(responseText);
		instantiateRockets(jsonStorage);
	})
	.catch(e => {
  		console.log('Fetch operation failed: ' + e.message);
	})
}
const replayGame = function(){
	clearTimeouts();
	resetGameState();
	instantiateRockets(jsonStorage);
}
const instantiateRockets = function(jsonStorage){
	for(let obj of jsonStorage){
		let newRocket = new Rocket(obj.id, obj.first_stage.fuel_amount_tons, obj.second_stage.fuel_amount_tons);
		rocketsStillFying += 1;
		totalLaunchPrice += obj.cost_per_launch;

		newRocket.launchRocket();
	}
}

const gameOver= function(){
	successOverlay.classList.remove('notDisplayed');
	popupNote.textContent = `Success! This little maneuvre cost us $${totalLaunchPrice}. Want to go again?`;
	successPopup.classList.remove('notDisplayed');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', replayGame);

document.addEventListener('keyup', event=> {
	if((event.keyCode === 13) && successOverlay.classList.contains('notDisplayed')){
		startGame();
	}else{
		successOverlay.classList.add('notDisplayed');
		successPopup.classList.add('notDisplayed');
	}
});