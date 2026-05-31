// ----------------------------------------------------------------------------
// HELPER FUNCTIONS AND CONSTANTS
// ----------------------------------------------------------------------------

const leftMotor = ev3_motorA();
const rightMotor = ev3_motorD(); 
const ultraSensor = ev3_ultrasonicSensor();
const colorSensor = ev3_colorSensor();
const touch = ev3_touchSensor2();
const maxSpeed = 1000;
const dangerThreshold = 6; // 0 6 7 (dangerous) 2 3 4 (safe)
const attackDist = 10;
const base = 0;
const turn = 1000;

ev3_motorSetStopAction(leftMotor, "hold");
ev3_motorSetStopAction(rightMotor, "hold");

function turnDegrees(angle, speed) { // turns clockwise
    const turnFactor = 7.5; 
    const rotation = angle * turnFactor;
    ev3_runToRelativePosition(leftMotor, -rotation, speed);
    ev3_runToRelativePosition(rightMotor, rotation, speed);
    ev3_pause(math_abs(rotation / speed * 1000) + 300);
}

function inDangerZone() {
    let zone = ev3_colorSensorGetColor(colorSensor);
    return (zone >= dangerThreshold || zone === 0);
}

// Returns distance to enemy (should be within 140cm, diameter of dohyo)
function enemyDist(){ 
    const conversionFactor = 0.105;
    return (ev3_ultrasonicSensorDistance(ultraSensor) 
                                * conversionFactor ) ;
}
function moveForward(distanceCm, speed) {
    const conversionFactor = -60;
    const rotation = distanceCm * conversionFactor;
    ev3_runToRelativePosition(leftMotor, rotation, speed);
    ev3_runToRelativePosition(rightMotor, rotation, speed);
    ev3_pause(math_abs(rotation / speed * 1000) + 300);
}

// ----------------------------------------------------------------------------
// STATES
// ----------------------------------------------------------------------------

let searchCounter = 1;
let searchDir = [null, 0, 45, -90, -45, -90];

function uTurn(){
    display("uTurn");
    nextState = prevState;
    moveForward(-5, maxSpeed);
    turnDegrees(180, maxSpeed);
}

function forward(){
    display("forward");
    prevState = forward;
    // Drives both motors at maxSpeed to get off the starting line 
    // or re-enter the ring interior after a pivot
    
    while (!ev3_touchSensorPressed(touch)){
        if(inDangerZone() && enemyDist() > 20){
            nextState = uTurn;
            break;
        } else if (enemyDist() > 100){
            nextState = search;
            break;
        } else {
            nextState = forward;
            ev3_motorSetSpeed(leftMotor,  -maxSpeed);
            ev3_motorSetSpeed(rightMotor, -maxSpeed);
        }
        ev3_motorStart(leftMotor);
        ev3_motorStart(rightMotor);
        ev3_pause(10);
    }
    ev3_motorStop(leftMotor);
    ev3_motorStop(rightMotor);
}

function search() {
    display("search");
    prevState = search;
    let count = 0;
    while(!ev3_touchSensorPressed(touch) && count < 15) {
        count = count + 1;
        let left_speed = base + turn;
        let right_speed = base - turn;
        status();
        if (enemyDist() < 100) {
            nextState = forward;
            break;
        } else {
            ev3_motorSetSpeed(leftMotor,  left_speed);
            ev3_motorSetSpeed(rightMotor, right_speed);
        }
        ev3_motorStart(leftMotor);
        ev3_motorStart(rightMotor);
        ev3_pause(10);
    }
    while(!ev3_touchSensorPressed(touch)) {
        let left_speed = base + turn;
        let right_speed = base - turn;
        status();
        if (enemyDist() < 100) {
            nextState = forward;
            break;
        } else {
            ev3_motorSetSpeed(leftMotor,  left_speed);
            ev3_motorSetSpeed(rightMotor, right_speed);
        }
        ev3_motorStart(leftMotor);
        ev3_motorStart(rightMotor);
        ev3_pause(10);
    }
    ev3_motorStop(leftMotor);
    ev3_motorStop(rightMotor);
} 

function status(){
    display(enemyDist());
    display(inDangerZone());
}


function start(){
    firstState();
    while(!ev3_touchSensorPressed(touch)){
        nextState();
    }
}

const firstState = search; // change this
