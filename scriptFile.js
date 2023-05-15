
//Note remove this sleep function it is useless
function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}

//global elements
var pointsArr;

//Important note about trianglesArr: The points of a triangle have to be declared in counter clockwise order. Do NOT mix the order up.
var trianglesArr;

var worldIHat, worldJHat, worldKhat;
var camIHat, camJHat, camKHat;


var projSpotIHat, projSpotJHat, projSpotKhat;



//hybridMatrix is a 3x3 matrix that gets updated as each camera rotation is applied. Multiply the current hybridMatrix with the current camera rotation.
//In code, its an array of 3 sub arrays. Each sub array is I^, J^ and K^ respectively. Each number in that sub array is their X, Y, and Z coordinate respectively
var hybridMatrix;
//hybridMatrixStack is a stack structure that keeps track of all the rotation transformations that the camera undergoes. Every time a new rotation is done, the relevant rotation matrix is added to the stack
var hybridMatrixStack;

//an array (for now). each value in the array will be a string that represents the rotation Horz or Vert
var rotMatrixStack;
var rotMatrixStackIndex;


var gridRows = 10;
var gridColumns = 10;


//array with 3 vals. This represents the centerpoint of the cam
var camCoords;

//the ROCompensatorHorz compensates for angle differences between origin and cam horizontally.
var camXPlaneToOriginAngle;

var camYPlaneToOriginAngle;


//To do watermelon : make sure you factor in camROCompensatorVert for vertical angle differences.
var camROCompensatorVert;


var camRO;
var camROVert;


//these represent the dimensions. If the width is 4, then the centerpoint is at 2. The measurement units are the standard ones for the grid (1 unit on the cam = 1 unit on the grid)
var camWidth = 10;
var camHeight = 10;

//this value is the angle at which all the points on the scene should shoot rays (it directly corresponds to the camRO). Might be useless, but just use it
var projectionRO

//cam screen displacement vector. Will be used to decide where to draw the points (how much to displace from original position)
//Note that this is a 2 value array that only represents where on the cam's POV the displacement should be. These coords do not track its position in the 3D space.
var camScreenDV;


//an object that holds multiple values related to the camViewScope. [0]:scopeNormalsLength(the central pole that determines how long the scope should be)
//[1]:the horzScopeAngle. This value decides how many radians should span from the scopeNormals to the left or right side of the scope (horizontally)
//[2]: the vertScopeAngle. This value decides how many radians should span from the scopeNormals to the up or down side of the scope.
var camViewScope;

//this object holds the dynamically changing coordinates of the camViewScope.[0]:scopeNormalsEndPoint(x,y,z)
//[1]: topLeftPoint(x, y, z), [2]: bottomLeftPoint(x, y, z), [3]: bottomrightPoint(x, y, z), [4]: toprightPoint(x, y, z)
var camViewScopeCoords;


//The convergence point that is placed behind the cam screen for the lens effects
var camConvergencePoint;


var camConvergenceAmount;



//canvas elements
//TV canvas
var TVcanvas = document.getElementById('TVCanvas');
var TVCTX = TVcanvas.getContext('2d');

//CamV Canvas
var CamVCanvas = document.getElementById('CamCanvas');
var CamVCTX = CamVCanvas.getContext('2d');


//SV Canvas
var SVcanvas = document.getElementById('SVCanvas');
var SVCTX = SVcanvas.getContext('2d');


//Toggle switches
var projectionRaysTVToggleSwitch;
var projectionRaysTVStrongToggleSwitch;
var projectionRaysTrianglesTVStrongToggleSwitch;

var projectionRaysSVStrongToggleSwitch;
var projectionRaysTrianglesSVStrongToggleSwitch;

var toggleSwitch_lens_CCToProjSpot;

var sceneInitializedCheckSwitch;
var joystickActiveSwitch;

//will create a unit cube where all the triangles have the same points
//to be used for testing purposes
//modifed: it will create a really small cube with 4 distinct faces but with an extremely small size so that its visible on the screen.
function createMicroUnitCube(ox, oy, oz){
  let arrOfTriangles = [];

  let frontface1 = [[ox, oy, oz], [ox+0.1, oy, oz], [ox+0.1, oy+0.1, oz]];
  let frontface2 = [[ox, oy, oz], [ox+0.1, oy+0.1, oz], [ox, oy+0.1, oz]];

  //east face
  let eastface1 = [[ox+0.1, oy, oz], [ox+0.1, oy, oz+0.1], [ox+0.1, oy+0.1, oz+0.1]];
  let eastface2 = [[ox+0.1, oy, oz], [ox+0.1, oy+0.1, oz+0.1], [ox+0.1, oy+0.1, oz]];


  //back face
  let backface1 = [[ox+0.1, oy, oz+0.1], [ox, oy, oz+0.1], [ox+0.1, oy+0.1, oz+0.1]];
  let backface2 = [[ox, oy, oz+0.1], [ox, oy+0.1, oz+0.1], [ox+0.1, oy+0.1, oz+0.1]];

  //west face
  let westface1 = [[ox, oy, oz+0.1], [ox, oy+0.1, oz], [ox, oy+0.1, oz+0.1]];
  let westface2 = [[ox, oy, oz+0.1], [ox, oy, oz], [ox, oy+0.1, oz]];

  arrOfTriangles[0] = frontface1;
  arrOfTriangles[1] = frontface2;
  arrOfTriangles[2] = eastface1;
  arrOfTriangles[3] = eastface2;

  arrOfTriangles[4] = backface1;
  arrOfTriangles[5] = backface2;

  arrOfTriangles[6] = westface1;
  arrOfTriangles[7] = westface2;

  return arrOfTriangles;

}






//will intialize the camera, worldHats, camHats, and all points. The camera will point direcly at the worldhats initially
function initializeScene(){

  camCoords = [0, 0, -3];
  camRO = 0;

  //camViewScope[0]:ScopeNormalsLength(the center pole), [1]: HorzScopeAngle, [2]: VertScopeAngle
  camViewScope = [4, 0.3, 0.3];
  //camViewScopeCoords = []


  rotMatrixStackIndex = 0;

  camROVert = 0;
  projectionRO = 0;

  worldIHat = [1, 0, 0];
  worldJHat = [0, 1, 0];
  worldKhat = [0, 0, 1];

  camIHat = [1, 0, 0];
  camJHat = [0, 1, 0];
  camKHat = [0, 0, 1];


  projSpotIHat = [1, 0, 0];
  projSpotJHat = [0, 1, 0];
  projSpotKhat = [0, 0, 1];


  camConvergencePoint = [0, 0, 0];
  camConvergencePoint[0] = camCoords[0];
  camConvergencePoint[1] = camCoords[1];
  camConvergencePoint[2] = camCoords[2] - 1;


  camConvergenceAmount = 4;

  //hybridMatrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  rotMatrixStack=["null"];

  camScreenDV = [0, 0];


  pointsArr = [[1, 1, 1], [2, 1, 1], [2, 2, 1], [1, 2, 1],
               [1, 1, 2], [2, 1, 2], [2, 2, 2], [1, 2, 2]

  ];


  let cubeArr = [];
 // cubeArr[0] = createMicroUnitCube(1, 1, 1);
  //cubeArr[1] = createMicroUnitCube(1, 1, 2);
  cubeArr[0] = createTripleUnitCube(2, -2, 4);
  cubeArr[1] = createTripleUnitCube(2, 1, 7);
  cubeArr[2] = createTripleUnitCube(-5, 1, 2);
cubeArr[3] = createTripleUnitCube(-5, -2, -2);

 // cubeArr[1] = createUnitCube(2, 2, 3);
 //cubeArr[2] = createUnitCube(-2, 0, 1);
 // cubeArr[3] = createUnitCube(4, 0, -3);

  let triangleStream = cubeArrToTriangleArrConverter(cubeArr);

  trianglesArr = triangleStream;

  //reassigning the triangleArr so that only the front face of the cube is rendered
 // trianglesArr = [ [ [1, 1, 1], [2, 1, 1], [2, 2, 1] ], [ [2, 2, 1], [1, 2, 1], [1, 1, 1]  ]  ];


 // trianglesArr = createUnitCube(1, 1, 1);




  sceneInitializedCheckSwitch = true;

  //Now will turn on the indicator light
  //document.getElementById("initializeSceneIndicatorLight").style.background = "radial-gradient(white 0%, pink 30%, red 70%)";
  document.getElementById("initializeSceneIndicatorLight").style.background = "radial-gradient(#ff4f7b 10%, #ff4f7b 20%, red 70%)";
  document.getElementById("initializeSceneIndicatorLight").style.boxShadow = "1px 1px 2px 2px red, -1px -1px 2px 2px red";

  updateWarningsPanel();


   projectionRaysTVToggleSwitch = false;
   projectionRaysTVStrongToggleSwitch = false;
   projectionRaysTrianglesTVStrongToggleSwitch = false;

   projectionRaysSVStrongToggleSwitch = false;
   projectionRaysTrianglesSVStrongToggleSwitch = false;

   toggleSwitch_lens_CCToProjSpot = false;

   sceneInitializedCheckSwitch = false;
   joystickActiveSwitch = false;



}

//will take in an array of cubes and convert them into one stream of triangles (an array of triangles)
function cubeArrToTriangleArrConverter(cubeArr){

  let streamOfTriangles = [];

  for(let c=0; c<cubeArr.length; c=c+1){

    for(let t=0; t<cubeArr[c].length; t=t+1){
      streamOfTriangles.push(cubeArr[c][t]);
    }
  }
  return streamOfTriangles;

}

function createTripleUnitCube(ox, oy, oz){

   let arrOfTriangles = [];

  //front face
  let frontface1 = [[ox, oy, oz], [ox + 3, oy, oz], [ox + 3, oy + 3, oz]];
  let frontface2 = [[ox, oy, oz], [ox + 3, oy + 3, oz], [ox, oy + 3, oz]];

  //east face
  let eastface1 = [[ox + 3, oy, oz], [ox + 3, oy, oz + 3], [ox + 3, oy + 3, oz + 3]];
  let eastface2 = [[ox + 3, oy, oz], [ox + 3, oy + 3, oz + 3], [ox + 3, oy + 3, oz]];


  //back face
  let backface1 = [[ox + 3, oy, oz + 3], [ox, oy, oz + 3], [ox + 3, oy + 3, oz + 3]];
  let backface2 = [[ox, oy, oz + 3], [ox, oy + 3, oz + 3], [ox + 3, oy + 3, oz + 3]];

  //west face
  let westface1 = [[ox, oy, oz + 3], [ox, oy + 3, oz], [ox, oy + 3, oz + 3]];
  let westface2 = [[ox, oy, oz + 3], [ox, oy, oz], [ox, oy + 3, oz]];




  arrOfTriangles[0] = frontface1;
  arrOfTriangles[1] = frontface2;
  arrOfTriangles[2] = eastface1;
  arrOfTriangles[3] = eastface2;

  arrOfTriangles[4] = backface1;
  arrOfTriangles[5] = backface2;

  arrOfTriangles[6] = westface1;
  arrOfTriangles[7] = westface2;




  return arrOfTriangles;


}


function createDoubleUnitCube(ox, oy, oz) {

  let arrOfTriangles = [];

  //front face
  let frontface1 = [[ox, oy, oz], [ox + 2, oy, oz], [ox + 2, oy + 2, oz]];
  let frontface2 = [[ox, oy, oz], [ox + 2, oy + 2, oz], [ox, oy + 2, oz]];

  //east face
  let eastface1 = [[ox + 2, oy, oz], [ox + 2, oy, oz + 2], [ox + 2, oy + 2, oz + 2]];
  let eastface2 = [[ox + 2, oy, oz], [ox + 2, oy + 2, oz + 2], [ox + 2, oy + 2, oz]];


  //back face
  let backface1 = [[ox + 2, oy, oz + 2], [ox, oy, oz + 2], [ox + 2, oy + 2, oz + 2]];
  let backface2 = [[ox, oy, oz + 2], [ox, oy + 2, oz + 2], [ox + 2, oy + 2, oz + 2]];

  //west face
  let westface1 = [[ox, oy, oz + 2], [ox, oy + 2, oz], [ox, oy + 2, oz + 2]];
  let westface2 = [[ox, oy, oz + 2], [ox, oy, oz], [ox, oy + 2, oz]];




  arrOfTriangles[0] = frontface1;
  arrOfTriangles[1] = frontface2;
  arrOfTriangles[2] = eastface1;
  arrOfTriangles[3] = eastface2;

  arrOfTriangles[4] = backface1;
  arrOfTriangles[5] = backface2;

  arrOfTriangles[6] = westface1;
  arrOfTriangles[7] = westface2;




  return arrOfTriangles;


}



//will create a unit cube (a cube of 1 unit dimensions) at the x,y,z coordinates specified. Will extend from -x to +x. So if you
//specify the origin at 1, it will go from 1 to 2. Will return an array of 12 triangles
function createUnitCube(ox, oy, oz){

  let arrOfTriangles = [];

  //front face
  let frontface1 = [[ox, oy, oz], [ox+1, oy, oz], [ox+1, oy+1, oz]];
  let frontface2 = [[ox, oy, oz], [ox+1, oy+1, oz], [ox, oy+1, oz]];

  //east face
  let eastface1 = [[ox+1, oy, oz], [ox+1, oy, oz+1], [ox+1, oy+1, oz+1]];
  let eastface2 = [[ox+1, oy, oz], [ox+1, oy+1, oz+1], [ox+1, oy+1, oz]];


  //back face
  let backface1 = [[ox+1, oy, oz+1], [ox, oy, oz+1], [ox+1, oy+1, oz+1]];
  let backface2 = [[ox, oy, oz+1], [ox, oy+1, oz+1], [ox+1, oy+1, oz+1]];

  //west face
  let westface1 = [[ox, oy, oz+1], [ox, oy+1, oz], [ox, oy+1, oz+1]];
  let westface2 = [[ox, oy, oz+1], [ox, oy, oz], [ox, oy+1, oz]];




  arrOfTriangles[0] = frontface1;
  arrOfTriangles[1] = frontface2;
  arrOfTriangles[2] = eastface1;
  arrOfTriangles[3] = eastface2;

  arrOfTriangles[4] = backface1;
  arrOfTriangles[5] = backface2;

  arrOfTriangles[6] = westface1;
  arrOfTriangles[7] = westface2;




  return arrOfTriangles;


}









function render(){

  renderTV();

  renderCamV();

  renderSV();

  displayText();



}


function renderTV(){

  drawGridTV();

  drawCamTV();

  drawWorldHatsTV();

  drawCamHatsTV();

  drawCamDistToOrigin();

  drawCamNormalsTV();

  drawProjectionRaysTV();

  drawProjectionRaysTVStrong();

  drawProjectionRaysTrianglesTVStrong();


  drawTrianglesTV();


  displayText();



  /**
  drawCamROArcTV();







  */



}


function renderCamV(){

  //CamVCTX.clearRect(0, 0, CamVCanvas.width, CamVCanvas.height);

  drawCamScreenGridCamV();

  calculateCamScreenDV();

  drawCamScreenDVCamV();



  //temporarily commented out
  //old function. Use draw triangles CamV instead
  //drawPointsCamV();

  //insert triangle LOOPER here
  for(let t=0; t<trianglesArr.length; t=t+1){

  //  console.log("++++++++++++++++++++");

    drawTrianglesCamV(trianglesArr[t]);

   // console.log("------------------");
    //add a switch here
    drawTrianglesCamVConvergenceLensVersion(trianglesArr[t]);

  //  console.log("--------------------");

  }



  drawCamHatsCamV();


  drawColorRefCirclesCamV();



}


function renderSV(){

  drawGridSV();

  drawCamSV();

  drawWorldHatsSV();

  drawCamHatsSV();

  drawCamDistToOriginSV();


  drawCamNormalsSV();

  drawProjectionRaysSVStrong();

  drawProjectionRaysTrianglesSVStrong();



  /**

  drawProjectionRaysSV();

  drawProjectionRaysSVStrong();

  drawProjectionRaysTrianglesSVStrong();

  drawTrianglesSV();
   */

  //displayText();


}




//START OF TOGGLE FUNCTIONS

//start of TV toggle functions
//will draw projection rays at the "appropriate" length
function drawProjectionRaysTV(){
  //checking if switch is turned on
  if(projectionRaysTVToggleSwitch != true){

    //NOTE: If the shoot rays function is not working, then use this function below
    drawProjectionRaysWorldHatsTVImproved();
   //using the shoot rays function to shoot at the right angle according to camRO. Length is not being considered this moment, so just shooting beyond the canvas because ultimately its the intersection which needs to be checked

  //drawProjectionRaysWorldHatsTVRayShootMethod();


  }

  //inner function: will draw the camHats's projected rays
  function drawProjectionRaysWorldHatsTV(){

    //concept: just draw from camHatCoord to CamScreen (but push it through a displacement channel before it lands on the cam)

    //CamI^
    //let displacedX = camIHat[0] + camScreenDV[0];
    //drawLineFCImproved(TVcanvas, TVCTX, camIHat[0], [camIHat[2]], displacedX,  )


    //new concept:
    //calculate distance from camHat tip to camCenter


    //new concept:
    //just replicate drawCamNormalsTV
    //but in the drawLineFC,
    //change org coords to the currnet
    //one in the loop.
    //and displace the destination by the coord's inherent coords
    let camDistSquared = Math.pow(camCoords[0],2) + Math.pow(camCoords[2],2);
    let camDist = Math.sqrt(camDistSquared);

    //dealing with I^
    //TO DO : watermelon : You need to add some value to virtualX and virtualY so that it will land exactly on the screen. Right now it is in the correct angle but it is not shooting far enough. So find out what you need. Do the trig.
    let virtualIX = camCoords[0] + (Math.cos(camRO)*camScreenDV[0]) + worldIHat[0];
    let virtualIY = camCoords[2] + (-(Math.sin(camRO))*camScreenDV[0]) + worldIHat[2];

    //adding the camHat to worldHat distance: sin(RO) = opp/hyp (hyp is 1)

    TVCTX.setLineDash([4, 7]);
    drawLineFCImproved(TVcanvas, TVCTX, worldIHat[0], worldIHat[2], virtualIX, virtualIY, "Orange");
    TVCTX.setLineDash([]);


    //dealing with J^
    //TO DO : watermelon : You need to add some value to virtualX and virtualY so that it will land exactly on the screen. Right now it is in the correct angle but it is not shooting far enough. So find out what you need. Do the trig.
    let virtualJX = camCoords[0] + (Math.cos(camRO)*camScreenDV[0]) + worldJHat[0];
    let virtualJY = camCoords[2] + (-(Math.sin(camRO))*camScreenDV[0]) + worldJHat[2];

    TVCTX.setLineDash([4, 7]);
    drawLineFCImproved(TVcanvas, TVCTX, worldJHat[0], worldJHat[2], virtualJX, virtualJY, "Orange");
    TVCTX.setLineDash([]);



    //dealing with K^
    let virtualKX = camCoords[0] + (Math.cos(camRO)*camScreenDV[0]) + worldKhat[0];
    let virtualKY = camCoords[2] + (-(Math.sin(camRO))*camScreenDV[0]) + worldKhat[2];

    TVCTX.setLineDash([4, 7]);
    drawLineFCImproved(TVcanvas, TVCTX, worldKhat[0], worldKhat[2], virtualKX, virtualKY, "Orange");
    TVCTX.setLineDash([]);


  }

  function drawProjectionRaysWorldHatsTVImproved(){

    //dealing with WI^
    //step 1: calculated distFromCamCenterToPoint
    let iHatXDisp = worldIHat[0] - camCoords[0];
    let iHatZDisp = worldIHat[2] - camCoords[2];
    //verify
    let distToPoint = Math.sqrt(Math.pow(iHatXDisp, 2) + Math.pow(iHatZDisp, 2));

    let rayLength = Math.sqrt(Math.pow(distToPoint, 2) - Math.pow(camScreenDV[0], 2));

   // console.log("raylength: " + rayLength);
    //now find the landing point of the ray
    let landXDisp = rayLength * Math.cos((Math.PI/2)+camRO);
    let landYDisp = rayLength * Math.sin((Math.PI/2)+camRO);

   // console.log("landXDisp:" + landXDisp);
   // console.log("landYDisp: " + landYDisp);

    TVCTX.setLineDash([4, 7]);
    drawLineFCImproved(TVcanvas, TVCTX, worldIHat[0], worldIHat[2], worldIHat[0]-(landXDisp*1), worldIHat[2]-(landYDisp*1), "Orange");
    TVCTX.setLineDash([]);





  }

}


function drawProjectionRaysTrianglesTVStrong(){

  if(projectionRaysTrianglesTVStrongToggleSwitch == true){

    drawProjectionRaysTrianglesTVRayShootMethod();


  }

  function drawProjectionRaysTrianglesTVRayShootMethod(){

    for(let t=0; t<trianglesArr.length; t=t+1){

      for(let p=0; p<trianglesArr[t].length; p=p+1){

        shootRay(TVcanvas, TVCTX, trianglesArr[t][p][0], trianglesArr[t][p][2], -(camRO)+(Math.PI), 10, "Red");

      }

    }

  }

}


//will draw projection rays at an "infinite" length
function drawProjectionRaysTVStrong(){

  if(projectionRaysTVStrongToggleSwitch == true) {

    drawProjectionRaysWorldHatsTVRayShootMethod();

    drawProjectionRaysCamHatsTVRayShootMethod();




  }



  function drawProjectionRaysCamHatsTVRayShootMethod(){
    shootRay(TVcanvas, TVCTX, camIHat[0], camIHat[2], camRO+(Math.PI), 10, "Blue");

    shootRay(TVcanvas, TVCTX, camJHat[0], camJHat[2], camRO+(Math.PI), 10, "Orange");

    shootRay(TVcanvas, TVCTX, camKHat[0], camKHat[2], camRO+(Math.PI), 10, "Yellow");
  }

  function drawProjectionRaysWorldHatsTVRayShootMethod(){

    //dealing with worldI^
    //might have to turn camRO negative here
    shootRay(TVcanvas, TVCTX, worldIHat[0], worldIHat[2], camRO+(Math.PI), 10, "Orange");

    shootRay(TVcanvas, TVCTX, worldJHat[0], worldJHat[2], camRO+(Math.PI), 10, "Orange");

    shootRay(TVcanvas, TVCTX, worldKhat[0], worldKhat[2], camRO+(Math.PI), 10, "Orange");



  }


}
//end of TV toggle functions

//will shoot a ray from the CC (camera center) towards the projection spot (where the ray lands on the screen)
function toggleLens_CCToProjSpot(){
  if(toggleSwitch_lens_CCToProjSpot==false){
    toggleSwitch_lens_CCToProjSpot = true;
    document.getElementById("DistCCProjSpotXDispRedLight").style.backgroundColor = "Red";
  }

  else{
    toggleSwitch_lens_CCToProjSpot = false;
    document.getElementById("DistCCProjSpotXDispRedLight").style.backgroundColor = "Transparent";
  }

}






//start of toggle switches

function greenIndicatorOn(buttonId){
  document.querySelector("#"+buttonId+" + div").style.background = "radial-gradient(#75ff93 20%, #47fc6e 30%, #19f749 70%)";
  document.querySelector("#"+buttonId+" + div").style.boxShadow = "1px 1px 2px 1px #47fc6e, -1px -1px 2px 1px #47fc6e";
  document.querySelector("#"+buttonId+" + div").style.border = "2px solid transparent";

}

function greenIndicatorOff(buttonId){
  document.querySelector("#"+buttonId+" + div").style.background = "black";
  document.querySelector("#"+buttonId+" + div").style.boxShadow = "none";
  document.querySelector("#"+buttonId+" + div").style.border = "2px solid green";
}

function greenIndicatorObjVersion(obj){
  obj.style.background = "radial-gradient(#75ff93 20%, #47fc6e 30%, #19f749 70%)";
  obj.style.boxShadow = "1px 1px 2px 1px #47fc6e, -1px -1px 2px 1px #47fc6e";
  obj.style.border = "2px solid transparent";
}

function greenIndicatorOffObjVersion(obj){
  obj.style.background = "black";
  obj.style.boxShadow = "none";
  obj.style.border = "2px solid green";

}


function toggleProjectionRaysSVStrong(){

  let target = document.querySelector("#toggleFunctionsPanel section section:nth-child(5) div");

  if(projectionRaysSVStrongToggleSwitch==false){
    projectionRaysSVStrongToggleSwitch = true;
    greenIndicatorObjVersion(target);
  }

  else{
    projectionRaysSVStrongToggleSwitch = false;
    greenIndicatorOffObjVersion(target);
  }

}


function toggleProjectionRaysTV(){
  if(projectionRaysTVToggleSwitch==false) {
    projectionRaysTVToggleSwitch = true;

    greenIndicatorOn("toggleProjectionRaysTVButton");


  }

  else{
    projectionRaysTVToggleSwitch = false;
    greenIndicatorOff("toggleProjectionRaysTVButton");
  }
}


function toggleProjectionRaysTVStrong(){

  let target = document.querySelector("#toggleFunctionsPanel section section:nth-child(4) div");
  if(projectionRaysTVStrongToggleSwitch==false){

    projectionRaysTVStrongToggleSwitch = true;


    greenIndicatorObjVersion(target);



  }

  else{
    projectionRaysTVStrongToggleSwitch = false;
    greenIndicatorOffObjVersion(target);

  }


}



function toggleProjectionRaysTrianglesTVStrong(){

  let target = document.querySelector("#toggleFunctionsPanel section section:nth-child(4) div");
  if(projectionRaysTrianglesTVStrongToggleSwitch==false){
    projectionRaysTrianglesTVStrongToggleSwitch = true;
    greenIndicatorObjVersion(target);
  }

  else{
    projectionRaysTrianglesTVStrongToggleSwitch = false;
    greenIndicatorOffObjVersion(target);
  }


}
//end of toggle switches


//END OF TOGGLE FUNCTIONS



//START OF DRAW FUNCTIONS

//<<start of TV draw functions>>

function drawGridTV(){

  var columnUnitLength = TVcanvas.width / gridColumns;
  var rowUnitLength = TVcanvas.height / gridRows;

  TVCTX.strokeStyle = "Grey";

  for(let x=0; x<=TVcanvas.width; x=x+columnUnitLength){

    if(x==TVcanvas.width/2){x=x+columnUnitLength;}

    TVCTX.beginPath();
    TVCTX.moveTo(x, 0);
    TVCTX.lineTo(x, TVcanvas.height);
    TVCTX.stroke();

  }


  for(y=0; y<=TVcanvas.height; y=y+rowUnitLength){

    if(y==TVcanvas.height/2){y=y+rowUnitLength;}

    TVCTX.beginPath();
    TVCTX.moveTo(0, y);
    TVCTX.lineTo(TVcanvas.width, y);
    TVCTX.stroke();


  }


  //drawing the axis

  TVCTX.strokeStyle = "Red";

  TVCTX.beginPath();
  TVCTX.moveTo(TVcanvas.width/2, 0);
  TVCTX.lineTo(TVcanvas.width/2, TVcanvas.height);
  TVCTX.stroke();


  TVCTX.beginPath();
  TVCTX.moveTo(0, TVcanvas.height/2);
  TVCTX.lineTo(TVcanvas.width, TVcanvas.height/2);
  TVCTX.stroke();


}

function drawCamTV(){


  //y(TV) is z
  //x(TV) is x

  TVCTX.strokeStyle = "Orange";

  let convertedCoordsCamOrigin = getCanvasCoordsOfActualCoords(camCoords[0], camCoords[2]);


  TVCTX.beginPath();
  //moving to center of cam
  TVCTX.moveTo(convertedCoordsCamOrigin[0], convertedCoordsCamOrigin[1]);


  let convertedCoordsDestLeftSide = getCanvasCoordsOfActualCoords(camCoords[0]+(Math.cos(camRO)*(camWidth/2)), camCoords[2]+(Math.sin(camRO)*(camWidth/2)));

  //now use the camRO to find out where the ends of the should be.
  //x = cos(RO) * (camWidth/2);
  //y = sin(RO) * (camWidth/2);


  TVCTX.lineTo((convertedCoordsDestLeftSide[0]), (convertedCoordsDestLeftSide[1]));

  /**
  console.log("camRO: " + camRO);
  console.log("Math.cos(camRO):" + Math.cos(camRO));
  console.log("Math.sin(camRO):" + Math.sin(camRO));
  console.log("lineToX: " + Math.cos(camRO)*(camWidth/2) + " ; lineToY: " + Math.sin(camRO)*(camWidth/2));
  */
  TVCTX.stroke();

  TVCTX.strokeStyle = "Green";

  TVCTX.beginPath();
  TVCTX.moveTo(convertedCoordsCamOrigin[0], convertedCoordsCamOrigin[1]);


  let convertedCoordsDestRightSide = getCanvasCoordsOfActualCoords((camCoords[0]-(Math.cos(camRO)*(camWidth/2))), (camCoords[2]-(Math.sin(camRO)*(camWidth/2))));

  TVCTX.lineTo(convertedCoordsDestRightSide[0], convertedCoordsDestRightSide[1]);
  TVCTX.stroke();

  //now drawing the centerpoint pole
  TVCTX.strokeStyle = "#00eaff";
  TVCTX.beginPath();
  TVCTX.moveTo(convertedCoordsCamOrigin[0], convertedCoordsCamOrigin[1]);

  let convertedCoordsCenterPole = getCanvasCoordsOfActualCoords(camCoords[0]-(Math.sin(camRO)), camCoords[2]+(Math.cos(camRO)));

  TVCTX.lineTo(convertedCoordsCenterPole[0], convertedCoordsCenterPole[1]);
  TVCTX.stroke();


  //now drawing the cam's screen grid lines
  drawCamScreemGridLinesTV();


  //first move to center, then find out the unit length for each cam grid square
  //we are now finding the length for covering 1 unit (so that's why we're not multiply cos(RO) with anything, because the hypoteneuse is 1)
  let unitIncrementLeftSideCoords = getCanvasCoordsOfActualCoords(Math.cos(camRO), Math.sin(camRO));



  //inner function
  function drawCamScreemGridLinesTV(){

    //Simply divide each canvas coordinate of each "wing" of the camera by how many ever units that wing has. You must move that distance on that axis

    //Dealing with right side:
    //these are how much it should increment each time on each axis
    let rightSideUnitX = (Math.cos(camRO));
    let rightSideUnitY = -(Math.sin(camRO));


    let currGridMarkerX = camCoords[0];
    let currGridMarkerY = camCoords[2];

    TVCTX.beginPath();
    TVCTX.fillStyle = "Blue";


    //Start on the center of the cam. And Increment by the above unit values
    for(let x=0; x<camWidth/2; x=x+1){

      //convert to canvasCoords
      let currGridMarkerCanvasCoords = getCanvasCoordsOfActualCoords(currGridMarkerX, currGridMarkerY);

      //draw on canvas
      TVCTX.arc(currGridMarkerCanvasCoords[0], currGridMarkerCanvasCoords[1], 5, 0, 2*Math.PI);
      TVCTX.fill();

      //increment formal coords
      currGridMarkerX = currGridMarkerX + rightSideUnitX;
      currGridMarkerY = currGridMarkerY - rightSideUnitY;

    }



    //dealing with the left side
    let leftSideUnitX = -(Math.cos(camRO));
    let leftSideUnitY = (Math.sin(camRO));

    currGridMarkerX = camCoords[0];
    currGridMarkerY = camCoords[2];

    TVCTX.beginPath();
    TVCTX.fillStyle = "Orange";

    for(let x=0; x<camWidth/2; x=x+1){

      //convert to canvasCoords
      let currGridMarkerCanvasCoords = getCanvasCoordsOfActualCoords(currGridMarkerX, currGridMarkerY);

      //draw on canvas
      TVCTX.arc(currGridMarkerCanvasCoords[0], currGridMarkerCanvasCoords[1], 5, 0, 2*Math.PI);
      TVCTX.fill();

      //increment formal coords
      currGridMarkerX = currGridMarkerX + leftSideUnitX;
      currGridMarkerY = currGridMarkerY - leftSideUnitY;

    }



  }


}

function drawWorldHatsTV(){



  //drawing IHat
  drawLineFC(TVCTX, 0, 0, worldIHat[0], worldIHat[1], "Orange");
  fillTextFC(TVCTX, worldIHat[0], worldIHat[1], "Orange", "WI^");

  //drawing JHat (Not really necessary to keep this in the TV. It will just overcrowd everything)
  //drawLineFC(TVCTX, 0, 0, 0, 0, "Orange");
  //fillTextFC(TVCTX, 0, 0, "Orange", "WJ^");

  //drawingKHat
  drawLineFC(TVCTX, 0, 0, worldKhat[0], worldKhat[2], "Orange");
  fillTextFC(TVCTX, worldKhat[0], worldKhat[2], "Orange", "WK^");

}

function drawCamHatsTV(){

  //X: sin(RO), Y: cos(RO)

  //drawning I^
  //old line below (DO NOT DELETE, Might come in handy for reference)
 // drawLineFC(TVCTX, 0, 0, (Math.cos(camRO)), -(Math.sin(camRO)), "Blue");
  drawLineFC(TVCTX, 0, 0, camIHat[0], camIHat[2], "Blue");

  //drawing K^
  //old line below (DO NOT DELETE, Migt come in handy for reference)
 // drawLineFC(TVCTX, 0, 0, (Math.sin(camRO)), (Math.cos(camRO)), "Blue");
  drawLineFC(TVCTX, 0, 0, camKHat[0], camKHat[2], "Green");






}

//this is basically the distance between the camera and the origin of the hats (0, 0). DO NOT confuse this with the displacement vector of the camScreen itself
function drawCamDistToOrigin(){

  TVCTX.setLineDash([4, 7]);
  drawLineFC(TVCTX, 0, 0, camCoords[0], camCoords[2], "Green");
  TVCTX.setLineDash([]);

}


//will draw a dotted line from the camHats to the camera screen, which will land on the spot that marks the tail of the camScreenDV
function drawCamNormalsTV(){


  //first calculating the distance from cam to origin
  //use pythagorean theorem
  let camDistSquared = Math.pow(camCoords[0],2) + Math.pow(camCoords[2],2);
  let camDist = Math.sqrt(camDistSquared);

  //the camScreenDV might exist on the cam's screen locally, but we are calculating the virtual position of where it exists in the world so we know where to draw the line
  let camScreenDVVirtualXCoord = camCoords[0] + (Math.cos(camRO)*camScreenDV[0]);
  let camScreenDVVirtualYCoord = camCoords[2] + (-(Math.sin(camRO))*camScreenDV[0]);



  TVCTX.setLineDash([4, 7]);
  drawLineFC(TVCTX, 0, 0, camScreenDVVirtualXCoord, camScreenDVVirtualYCoord, "Yellow" );

  TVCTX.setLineDash([]);


}

//will draw a yellow line representing the camScreenDV on the top view. Will also print a numeric reading of the value
//Make sure to use the camScreenDV variable when drawing this. Don't organically calculate it. This is to make sure all the values are correct
function drawCamScreenDVTV(){


  //draw from camCenter to unspecified location. Use the linear equation (y=mx+c) and see where it goes.



  //use linear equation. Use the camRO to the find the slope (m) and the cam's Z-coordinate to find the y intercept (b). Then increment your line's coordinate with this equation and keep looping until you've reached the length.
  //You need to find a way to measure the line that you're drawing. Use trig to do this.


}

//will draw the trianges on the TV
function drawTrianglesTV(){

  for(let t=0; t<trianglesArr.length; t=t+1){

    //p1
    let p1 = trianglesArr[t][0];
    drawLineFCImprovedDashed(TVcanvas, TVCTX, 0, 0, p1[0], p1[2], "Pink");

    let p2 = trianglesArr[t][1];
    drawLineFCImprovedDashed(TVcanvas, TVCTX, 0, 0, p2[0], p2[2], "Pink");

    let p3 = trianglesArr[t][2];
    drawLineFCImprovedDashed(TVcanvas, TVCTX, 0, 0, p3[0], p3[2], "Pink");


    //connect the points
    //p1 to p2
    drawLineFCImproved(TVcanvas, TVCTX, p1[0], p1[2], p2[0], p2[2], "Red");

    drawLineFCImproved(TVcanvas, TVCTX, p2[0], p2[2], p3[0], p3[2], "Red");

    drawLineFCImproved(TVcanvas, TVCTX, p3[0], p3[2], p1[0], p1[2], "Yellow");

  }




}






//<<end of TV draw functions>>


//<<start of camV draw functions>>


//Will draw the cam's screen specific grid (the one that exists locally on the screen; in other words, it remains static on the camView but rotates on all other views). draw these grid lines blue
//draw the leftside gridlines orange and the rightside grid lines blue
function drawCamScreenGridCamV(){

  var camColumnUnitLength = CamVCanvas.width / camWidth;
  var camRowUnitLength = CamVCanvas.height / camHeight;

  //drawing column Lines. Remember it using the formal coordinates so it has to start from the minimum range (formal coords) to the max range
  for(let x=-(camWidth/2); x<=camWidth/2; x=x+1){
    drawLineFCImproved(CamVCanvas, CamVCTX, x, -(camHeight), x, camHeight, "White");
  }

  //drawing row lines
  for(let y=-(camHeight/2); y<=camHeight/2; y=y+1){
    drawLineFCImproved(CamVCanvas, CamVCTX, -(camWidth), y, camWidth, y, "White");
  }


}

//will draw all the points in the pointsArr. Will use the displacement vector to decide where to draw
function drawPointsCamV(){


  let projectedTranslatedPointsArr = [0, 0, 0];
  let y=0;

  for(let x=0; x<pointsArr.length; x=x+1){

    let pointXCoord = (pointsArr[x][0]*camIHat[0]) + (pointsArr[x][1]*camJHat[0]) + (pointsArr[x][2]*camKHat[0]);

    let pointYCoord = (pointsArr[x][0]*camIHat[1]) + (pointsArr[x][1]*camJHat[1]) + (pointsArr[x][2]*camKHat[1]);

    let pointZCoord = (pointsArr[x][0]*camIHat[2]) + (pointsArr[x][1]*camJHat[2]) + (pointsArr[x][2]*camKHat[1]);

    let pointXCoordTranslated = camScreenDV[0]+pointXCoord;
    let pointYCoordTranslated = camScreenDV[1]+pointYCoord;



    projectedTranslatedPointsArr[y] = [pointXCoordTranslated, pointYCoordTranslated];

    y=y+1;

    drawLineFCImproved(CamVCanvas, CamVCTX, camScreenDV[0], camScreenDV[1], pointXCoordTranslated, pointYCoordTranslated, "Blue");

  }



  //connect the points

    for(let j=0; j<projectedTranslatedPointsArr.length; j=j+4) {
      connectFourPoints(projectedTranslatedPointsArr[j], projectedTranslatedPointsArr[j+1], projectedTranslatedPointsArr[j+2], projectedTranslatedPointsArr[j+3]);
    }


  //inner function
  function connectFourPoints(point1, point2, point3, point4){

    //p1 to p2:
    drawLineFCImproved(CamVCanvas, CamVCTX, point1[0], point1[1], point2[0], point2[1], "Red");

    //p2 to p3:
    drawLineFCImproved(CamVCanvas, CamVCTX, point2[0], point2[1], point3[0], point3[1], "Red");

    //p3 to p4:
    drawLineFCImproved(CamVCanvas, CamVCTX, point3[0], point3[1], point4[0], point4[1], "Red");

    //p4 to p1:
    drawLineFCImproved(CamVCanvas, CamVCTX, point4[0], point4[1], point1[0], point1[1], "Red");



  }


}


//will first draw the 3 points of a triangle as vectors from origin, then connect the dots. Do this for all triangles
//a triangle is an array of 3 sub arrays. A sub array is X, Y and Z of the point
//Updated: Will take in a triangle as a param, and then use the 3 points of that triangle
function drawTrianglesCamV(triangle){



    //p1
    let p1 = triangle[0];



    let p1ProjectedX = (p1[0]*camIHat[0]) + (p1[1]*camJHat[0]) + (p1[2]*camKHat[0]);
    //  let p1ProjectedX = (p1[0]*hybridMatrix[0][0]) + (p1[1]*hybridMatrix[1][0]) + (p1[2]*hybridMatrix[2][0]);

      let p1ProjectedY = (p1[0]*camIHat[1]) + (p1[1]*camJHat[1]) + (p1[2]*camKHat[1]);
     // let p1ProjectedY = (p1[0]*hybridMatrix[0][1]) + (p1[1]*hybridMatrix[1][1]) + (p1[2]*hybridMatrix[2][1]);

      let p1ProjectedZ = (p1[0]*camIHat[2]) + (p1[1]*camJHat[2]) + (p1[2]*camKHat[2]);
    //  let p1ProjectedZ = (p1[0]*hybridMatrix[0][2]) + (p1[1]*hybridMatrix[1][2]) + (p1[2]*hybridMatrix[2][2]);

    let p1ProjectedXTranslated = p1ProjectedX - camScreenDV[0];
    let p1ProjectedYTranslated = p1ProjectedY - camScreenDV[1];

    //applyConvergenceLens(p1ProjectedX, p1ProjectedY, p1ProjectedZ, p1[0], p1[1], p1[2]);
   // applyConvergenceLensBacktrackingMethod(p1ProjectedX, p1ProjectedY, p1ProjectedZ, p1[0], p1[1], p1[2]);
   // applyConvergenceLensCamTrackMethod(p1ProjectedX, p1ProjectedY, p1ProjectedZ, p1[0], p1[1], p1[2]);
   // applyConvergenceLensInverseCamHatSeq(p1ProjectedXTranslated, p1ProjectedYTranslated, p1ProjectedZ, p1[0], p1[1], p1[2]);
    //console.log("MILKF");

   // let refractionValsP1 = applyConvergenceLensProjSpotHatsMethod(p1ProjectedXTranslated, p1ProjectedYTranslated, p1ProjectedZ, p1[0], p1[1], p1[2]);

   // p1ProjectedXTranslated = p1ProjectedXTranslated + refractionValsP1[0];
  //  p1ProjectedYTranslated = p1ProjectedYTranslated + refractionValsP1[1];

    //drawing dotted vector of this point
    drawLineFCImprovedDashed(CamVCanvas, CamVCTX, camScreenDV[0], camScreenDV[1], p1ProjectedXTranslated, p1ProjectedYTranslated, "Pink");

    //console.log("Triangle Index:  " + t + " , zCoord: " + p1[2] + " ; refractX: " + refractionValsP1[0] + " , refractY: " + refractionValsP1[1]);


    //p2
    let p2 = triangle[1];



    let p2ProjectedX = (p2[0]*camIHat[0]) + (p2[1]*camJHat[0]) + (p2[2]*camKHat[0]);
   //  let p2ProjectedX = (p2[0]*hybridMatrix[0][0]) + (p2[1]*hybridMatrix[1][0]) + (p2[2]*hybridMatrix[2][0]);

    let p2ProjectedY = (p2[0]*camIHat[1]) + (p2[1]*camJHat[1]) + (p2[2]*camKHat[1]);
  //  let p2ProjectedY = (p2[0]*hybridMatrix[0][1]) + (p2[1]*hybridMatrix[1][1]) + (p2[2]*hybridMatrix[2][1]);

    let p2ProjectedZ = (p2[0]*camIHat[2]) + (p2[1]*camJHat[2]) + (p2[2]*camKHat[2]);
   //  let p2ProjectedZ = (p2[0]*hybridMatrix[0][2]) + (p2[1]*hybridMatrix[1][2]) + (p2[2]*hybridMatrix[2][2]);

    let p2ProjectedXTranslated = p2ProjectedX - camScreenDV[0];
    let p2ProjectedYTranslated = p2ProjectedY - camScreenDV[1];

   // let refractionValsP2 = applyConvergenceLensProjSpotHatsMethod(p2ProjectedXTranslated, p2ProjectedYTranslated, p2ProjectedZ, p2[0], p2[1], p2[2]);

   // p2ProjectedXTranslated = p2ProjectedXTranslated + refractionValsP2[0];
   // p2ProjectedYTranslated = p2ProjectedYTranslated + refractionValsP2[1];


    //drawing dotted vector of this point
    drawLineFCImprovedDashed(CamVCanvas, CamVCTX, camScreenDV[0], camScreenDV[1], p2ProjectedXTranslated, p2ProjectedYTranslated, "Pink");



    //p3
    let p3 = triangle[2];



    let p3ProjectedX = (p3[0]*camIHat[0]) + (p3[1]*camJHat[0]) + (p3[2]*camKHat[0]);
   //  let p3ProjectedX = (p3[0]*hybridMatrix[0][0]) + (p3[1]*hybridMatrix[1][0]) + (p3[2]*hybridMatrix[2][0]);


    let p3ProjectedY = (p3[0]*camIHat[1]) + (p3[1]*camJHat[1]) + (p3[2]*camKHat[1]);
   // let p3ProjectedY = (p3[0]*hybridMatrix[0][1]) + (p3[1]*hybridMatrix[1][1]) + (p3[2]*hybridMatrix[2][1]);


    let p3ProjectedZ = (p3[0]*camIHat[2]) + (p3[1]*camJHat[2]) + (p3[2]*camKHat[2]);
  //  let p3ProjectedZ = (p3[0]*hybridMatrix[0][2]) + (p3[1]*hybridMatrix[1][2]) + (p3[2]*hybridMatrix[2][2]);

    let p3ProjectedXTranslated = p3ProjectedX - camScreenDV[0];
    let p3ProjectedYTranslated = p3ProjectedY - camScreenDV[1];

    //let refractionValsP3 = [0, 0];
    // refractionValsP3 = applyConvergenceLensProjSpotHatsMethod(p3ProjectedXTranslated, p3ProjectedYTranslated, p3ProjectedZ, p3[0], p3[1], p3[2]);

   // p3ProjectedXTranslated = p3ProjectedXTranslated + refractionValsP3[0];
   // p3ProjectedYTranslated = p3ProjectedYTranslated + refractionValsP3[1];

  //  console.log("Egg: " + refractionValsP3[0] + " , " + refractionValsP3[1]);

    //drawing dotted vector of this point
    drawLineFCImprovedDashed(CamVCanvas, CamVCTX, camScreenDV[0], camScreenDV[1], p3ProjectedXTranslated, p3ProjectedYTranslated, "Pink");

  //console.log("Regular: P1X: " + p1ProjectedXTranslated + " ; P1Y: " + p1ProjectedYTranslated);
 //console.log("Regular: P2X: " + p2ProjectedXTranslated + " ; P2Y: " + p2ProjectedYTranslated);
  //console.log("Regular: P3X: " + p3ProjectedXTranslated + " ; P3Y: " + p3ProjectedYTranslated);
    //now connecting the 3 points
    //p1 to p2
    drawLineFCImproved(CamVCanvas, CamVCTX, p1ProjectedXTranslated, p1ProjectedYTranslated, p2ProjectedXTranslated, p2ProjectedYTranslated, "Red");

    //p2 to p3
    drawLineFCImproved(CamVCanvas, CamVCTX, p2ProjectedXTranslated, p2ProjectedYTranslated, p3ProjectedXTranslated, p3ProjectedYTranslated, "Red");

    //p3 to p1
    drawLineFCImproved(CamVCanvas, CamVCTX, p3ProjectedXTranslated, p3ProjectedYTranslated, p1ProjectedXTranslated, p1ProjectedYTranslated, "Yellow");



}

//A replication of the drawTrianglesCamV function but this time it factors in the convergence len function.
function drawTrianglesCamVConvergenceLensVersion(triangle){



    //p1
    let p1 = triangle[0];
    let p1ProjectedX = (p1[0]*camIHat[0]) + (p1[1]*camJHat[0]) + (p1[2]*camKHat[0]);



    //  let p1ProjectedX = (p1[0]*hybridMatrix[0][0]) + (p1[1]*hybridMatrix[1][0]) + (p1[2]*hybridMatrix[2][0]);

    let p1ProjectedY = (p1[0]*camIHat[1]) + (p1[1]*camJHat[1]) + (p1[2]*camKHat[1]);
    // let p1ProjectedY = (p1[0]*hybridMatrix[0][1]) + (p1[1]*hybridMatrix[1][1]) + (p1[2]*hybridMatrix[2][1]);

    let p1ProjectedZ = (p1[0]*camIHat[2]) + (p1[1]*camJHat[2]) + (p1[2]*camKHat[2]);
    //  let p1ProjectedZ = (p1[0]*hybridMatrix[0][2]) + (p1[1]*hybridMatrix[1][2]) + (p1[2]*hybridMatrix[2][2]);

    let p1ProjectedXTranslated = p1ProjectedX - camScreenDV[0];
    let p1ProjectedYTranslated = p1ProjectedY - camScreenDV[1];

    //applyConvergenceLens(p1ProjectedX, p1ProjectedY, p1ProjectedZ, p1[0], p1[1], p1[2]);
    // applyConvergenceLensBacktrackingMethod(p1ProjectedX, p1ProjectedY, p1ProjectedZ, p1[0], p1[1], p1[2]);
    // applyConvergenceLensCamTrackMethod(p1ProjectedX, p1ProjectedY, p1ProjectedZ, p1[0], p1[1], p1[2]);
    // applyConvergenceLensInverseCamHatSeq(p1ProjectedXTranslated, p1ProjectedYTranslated, p1ProjectedZ, p1[0], p1[1], p1[2]);
    //console.log("MILKF");

    let refractionValsP1 = applyConvergenceLensProjSpotHatsMethod(p1ProjectedXTranslated, p1ProjectedYTranslated, p1ProjectedZ, p1[0], p1[1], p1[2]);

  //console.log("refractionValsP1: " + refractionValsP1[0] + " : " + refractionValsP1[1]);
    // console.log("rdvSquared: " + Math.pow(refractionValsP1[2], 2) + " ; calced sum: " + (Math.pow(refractionValsP1[0], 2) + Math.pow(refractionValsP1[1], 2)));

    // console.log("px: " + p1ProjectedXTranslated + " ; py: " + p1ProjectedYTranslated + " ; rfx: " + refractionValsP1[0] + " ; rfy: " + refractionValsP1[1] + " RFDV: " + refractionValsP1[2]);

    //if its in a positive quadrant we need to turn it positive.
    if(p1ProjectedXTranslated>0){refractionValsP1[0] = refractionValsP1[0] * -1;}
    if(p1ProjectedYTranslated>0){refractionValsP1[1] = refractionValsP1[1] * -1;}

   // console.log("p1XInitial: " + p1ProjectedXTranslated + " , p1YInitial: " + p1ProjectedYTranslated);
   // console.log("refractionP1X: " + refractionValsP1[0] + " , refractionP1Y: " + refractionValsP1[1]);
   // console.log("FinalX: " + (p1ProjectedXTranslated + refractionValsP1[0]) + " FinalY: " + (p1ProjectedYTranslated + refractionValsP1[1]));

  //  refractionValsP1[0] = refractionValsP1[0] / 10;
  //  refractionValsP1[1] = refractionValsP1[1] / 10;

      /** LEMONPIE
      console.log("p1X(" + p1ProjectedXTranslated + ") + p1RFX(" + refractionValsP1[0] + ") = " + (p1ProjectedXTranslated + refractionValsP1[0]));
      console.log("p1Y(" + p1ProjectedYTranslated + ") + p1RFY(" + refractionValsP1[1] + ") = " + (p1ProjectedYTranslated + refractionValsP1[1]));
      */
      p1ProjectedXTranslated = p1ProjectedXTranslated - refractionValsP1[0];

      p1ProjectedYTranslated = p1ProjectedYTranslated - refractionValsP1[1];




    //drawing dotted vector of this point
    drawLineFCImprovedDashed(CamVCanvas, CamVCTX, camScreenDV[0], camScreenDV[1], p1ProjectedXTranslated, p1ProjectedYTranslated, "Blue");

  //  console.log("Triangle Index:  " + t + " , zCoord: " + p1[2] + " ; refractX: " + refractionValsP1[0] + " , refractY: " + refractionValsP1[1]);


    //p2
    let p2 = triangle[1];



    let p2ProjectedX = (p2[0]*camIHat[0]) + (p2[1]*camJHat[0]) + (p2[2]*camKHat[0]);
    //  let p2ProjectedX = (p2[0]*hybridMatrix[0][0]) + (p2[1]*hybridMatrix[1][0]) + (p2[2]*hybridMatrix[2][0]);

    let p2ProjectedY = (p2[0]*camIHat[1]) + (p2[1]*camJHat[1]) + (p2[2]*camKHat[1]);
    //  let p2ProjectedY = (p2[0]*hybridMatrix[0][1]) + (p2[1]*hybridMatrix[1][1]) + (p2[2]*hybridMatrix[2][1]);

    let p2ProjectedZ = (p2[0]*camIHat[2]) + (p2[1]*camJHat[2]) + (p2[2]*camKHat[2]);
    //  let p2ProjectedZ = (p2[0]*hybridMatrix[0][2]) + (p2[1]*hybridMatrix[1][2]) + (p2[2]*hybridMatrix[2][2]);

    let p2ProjectedXTranslated = p2ProjectedX - camScreenDV[0];
    let p2ProjectedYTranslated = p2ProjectedY - camScreenDV[1];

    let refractionValsP2 = applyConvergenceLensProjSpotHatsMethod(p2ProjectedXTranslated, p2ProjectedYTranslated, p2ProjectedZ, p2[0], p2[1], p2[2]);



    if(p2ProjectedXTranslated>0){refractionValsP2[0] = refractionValsP2[0] * -1;}
    if(p2ProjectedYTranslated>0){refractionValsP2[1] = refractionValsP2[1] * -1;}

   // refractionValsP2[0] = refractionValsP2[0] / 10;
  //  refractionValsP2[1] = refractionValsP2[1] / 10;


      p2ProjectedXTranslated = p2ProjectedXTranslated - refractionValsP2[0];

      p2ProjectedYTranslated = p2ProjectedYTranslated - refractionValsP2[1];





    //drawing dotted vector of this point
    drawLineFCImprovedDashed(CamVCanvas, CamVCTX, camScreenDV[0], camScreenDV[1], p2ProjectedXTranslated, p2ProjectedYTranslated, "Blue");



    //p3
    let p3 = triangle[2];



    let p3ProjectedX = (p3[0]*camIHat[0]) + (p3[1]*camJHat[0]) + (p3[2]*camKHat[0]);
    //  let p3ProjectedX = (p3[0]*hybridMatrix[0][0]) + (p3[1]*hybridMatrix[1][0]) + (p3[2]*hybridMatrix[2][0]);


    let p3ProjectedY = (p3[0]*camIHat[1]) + (p3[1]*camJHat[1]) + (p3[2]*camKHat[1]);
    // let p3ProjectedY = (p3[0]*hybridMatrix[0][1]) + (p3[1]*hybridMatrix[1][1]) + (p3[2]*hybridMatrix[2][1]);


    let p3ProjectedZ = (p3[0]*camIHat[2]) + (p3[1]*camJHat[2]) + (p3[2]*camKHat[2]);
    //  let p3ProjectedZ = (p3[0]*hybridMatrix[0][2]) + (p3[1]*hybridMatrix[1][2]) + (p3[2]*hybridMatrix[2][2]);

    let p3ProjectedXTranslated = p3ProjectedX - camScreenDV[0];
    let p3ProjectedYTranslated = p3ProjectedY - camScreenDV[1];

    let refractionValsP3 = [0, 0];
    refractionValsP3 = applyConvergenceLensProjSpotHatsMethod(p3ProjectedXTranslated, p3ProjectedYTranslated, p3ProjectedZ, p3[0], p3[1], p3[2]);

    if(p3ProjectedXTranslated>0){refractionValsP3[0] = refractionValsP3[0] * -1;}
    if(p3ProjectedYTranslated>0){refractionValsP3[1] = refractionValsP3[1] * -1;}

  //  refractionValsP3[0] = refractionValsP3[0] / 10;
   // refractionValsP3[1] = refractionValsP3[1] / 10;


      p3ProjectedXTranslated = p3ProjectedXTranslated - refractionValsP3[0];

      p3ProjectedYTranslated = p3ProjectedYTranslated - refractionValsP3[1];




    //  console.log("Egg: " + refractionValsP3[0] + " , " + refractionValsP3[1]);

    //drawing dotted vector of this point
    drawLineFCImprovedDashed(CamVCanvas, CamVCTX, camScreenDV[0], camScreenDV[1], p3ProjectedXTranslated, p3ProjectedYTranslated, "Blue");


  //console.log("Refracted: P1X: " + p1ProjectedXTranslated + " ; P1Y: " + p1ProjectedYTranslated);
  //console.log("Refracted: P2X: " + p2ProjectedXTranslated + " ; P2Y: " + p2ProjectedYTranslated);
  //console.log("Refracted: P3X: " + p3ProjectedXTranslated + " ; P3Y: " + p3ProjectedYTranslated);

    //now connecting the 3 points
    //p1 to p2
    drawLineFCImproved(CamVCanvas, CamVCTX, p1ProjectedXTranslated, p1ProjectedYTranslated, p2ProjectedXTranslated, p2ProjectedYTranslated, "Blue");

    //p2 to p3
    drawLineFCImproved(CamVCanvas, CamVCTX, p2ProjectedXTranslated, p2ProjectedYTranslated, p3ProjectedXTranslated, p3ProjectedYTranslated, "Blue");

    //p3 to p1
    drawLineFCImproved(CamVCanvas, CamVCTX, p3ProjectedXTranslated, p3ProjectedYTranslated, p1ProjectedXTranslated, p1ProjectedYTranslated, "Blue");








}





//will draw a yellow line (visual representation) of the camScreenDV to indicate whether its where its supposed to be and the correct length
function drawCamScreenDVCamV(){

  drawLineFCImproved(CamVCanvas, CamVCTX, 0, 0, camScreenDV[0], camScreenDV[1], "White");


}



//will draw the camhats on the camV
function drawCamHatsCamV(){

  //drawing CamIHat
  drawLineFCImproved(CamVCanvas, CamVCTX, camScreenDV[0], camScreenDV[1], camScreenDV[0]+camIHat[0], camScreenDV[1]+camIHat[1], "Blue");

  //drawing CamJHat
  drawLineFCImproved(CamVCanvas, CamVCTX, camScreenDV[0], camScreenDV[1], (camScreenDV[0]+camJHat[0]), (camScreenDV[1]+camJHat[1]), "Red");


  //drawing CamKHat
  drawLineFCImproved(CamVCanvas, CamVCTX, camScreenDV[0], camScreenDV[1], camScreenDV[0]+camKHat[0], camScreenDV[1]+camKHat[1], "Green");




}


//will draw the blue and orange circles on the camV so you can reference them with the points in the TV
function drawColorRefCirclesCamV(){

  let currGridMarkerX = 0;
  let currGridMarkerY = 0;

  CamVCTX.beginPath();
  CamVCTX.fillStyle = "Blue";

  for(let x=0; x<camWidth/2; x=x+1){

    let currGridMarkerCanvasCoords = getCanvasCoordsOfActualCoords(x, 0);

    CamVCTX.arc(currGridMarkerCanvasCoords[0], currGridMarkerCanvasCoords[1], 4, 0, 2*Math.PI);
    CamVCTX.fill();

  }

  CamVCTX.beginPath();
  CamVCTX.fillStyle = "Orange";

  for(let y=0; y>-(camWidth/2); y=y-1){
    let currGridMarkerCanvasCoords = getCanvasCoordsOfActualCoords(y, 0);

    CamVCTX.arc(currGridMarkerCanvasCoords[0], currGridMarkerCanvasCoords[1], 4, 0, 2*Math.PI);
    CamVCTX.fill();

  }


}

//will find the spots by considering cam in identity position and then following cam rotation sequence
function applyConvergenceLensCamTrackMethod(px, py, pz, staticPX, staticPY, staticPZ){

  //findProjSpot();

  findProjSpotDirectCamOrientation(px, py, pz);

 // findConvergencePoint();



  //Will consider the projSpot's location according to the cam in ID position. And simply orient that vector with the current camHats orientation via multiplication
  function findProjSpotDirectCamOrientation(px, py, pz){

    //step 0: apply the CSDV to them so we have the correct length
    px = px + camScreenDV[0];
    py = py + camScreenDV[1];
    //pz = pz;
    pz = pz;
    //Step 1: Find the rotation orientation of the vector by multiplying with camhats
    let translatedXComp = (px*camIHat[0]) + (py*camJHat[0]) + (pz*camKHat[0]);
    let translatedYComp = (px*camIHat[1]) + (py*camJHat[1]) + (pz*camKHat[1]);
    let translatedZComp = (px*camIHat[2]) + (py*camJHat[2]) + (pz*camKHat[2]);

    //now displacing them per the cam coords
    let displacedXComp = translatedXComp + camCoords[0];
    let displacedYComp = translatedYComp + camCoords[1];
    let displacedZComp = translatedZComp + camCoords[2];

    drawCircle(TVcanvas, TVCTX, displacedXComp, displacedZComp, "Yellow");



    //console.log("TXCOMPS: " + displacedXComp + " , " + displacedYComp + " , " + displacedZComp);


    //stsep 2: Now that you have the individual comp vectors. Just displace them as per the camCoords (start from the camCoords and then add those disps)
  }


  //inner function: Will find the real world coords of the projspot by considering its position when cam is under no HRO or VRO config. Then tracking it with the same sequence of rotations the cam went through
  function findProjSpot(px, py, pz){

    //remember that this projspot is like a vector that is using the CamCoords as its origin.

    /**
    //step1: find the real world coords of the projSpot when the cam is in its identity position (No HRO or VRO influence) (the coords are not important for now)
    let stage1ProjX = camCoords[0] + (px + camScreenDV[0]);
    let stage1ProjY = camCoords[1] + (py + camScreenDV[1]);
    let stage1ProjZ = camCoords[2];
    */

    //step1: Find the length of the ProjSpot Vector (this is the projSpot when viewed as a vector with the camCenter as the origin points).
   // let projSpotVecLen = Math.sqrt(Math.pow((px+camScreenDV[0]), 2) + Math.pow((py+camScreenDV[1]),2));


    //step 1: get the component vectors of the projSpotVec with the cam in its identity position
    let xComp = px + camScreenDV[0];
    let yComp = py + camScreenDV[1];
    //ZComp always starts out as 0 because the cam is in identity position
    let stage1_zComp = 0;


    let stage1_xComp_xDisp = Math.cos(camRO) * xComp;
    stage1_zComp = -(Math.sin(camRO) * xComp);

    //step 2: apply VRO rotation (using camHatsSequentialupdate as ref)
    let yComp_yComp = Math.cos(camROVert)*yComp;
    let yCompRed = Math.sin(camROVert) * yComp;
    let yComp_xComp = Math.sin(camRO) * yCompRed;
    let yComp_zComp = Math.cos(camRO) * yCompRed;




    //step3: apply HRO rotation (you will get new disps on the X and Z axis, y remains thee same
    let HRORot_XDisp = Math.cos(camRO) * projSpotVecLen;
    let HRORot_ZDisp = Math.sin(camRO) * projSpotVecLen;



    //final step: Once you have all the final Disps, just apply them starting from the camCenter




   //step 3: take the final disps after both types of rotation and add to camCoords to get real world coords of projspot



  }




}






//this one is correctly finding the spot
function applyConvergenceLensBacktrackingMethod(px, py, pz, staticPX, staticPY, staticPZ){

  //step 1: consider cam in current HRO+VRO config. Calc projection of YDisp of Local_CamCenterToProjSpot (CCTPS), onto prev frame (where only HRO is oriented)

  let local_CCTPS_YDisp = py + camScreenDV[1];

  //cos(vro) = adj / local_ccpts_ydisp
  let CCTPS_YDisp_PrevFrameYComp = Math.cos(camROVert) * local_CCTPS_YDisp;

  //tan(vro) = trajectory / CCT

  let VROInfluencedTrajectory = Math.tan(camROVert) * CCTPS_YDisp_PrevFrameYComp;

  //step 2: Now calc the XZ position of the projSpot in the HRO-only oriented frame. Call these prevFrame X and prevFrame Z

  let prevFrameHyp = px+camScreenDV[0];


  let prevFrameZComp = Math.sin(camRO) * prevFrameHyp;

  let prevFrameXComp = Math.cos(camRO) * prevFrameHyp;


  //step 2: use the trajectory (blue line) and HRO to work out the Z and X disps. Add these disps to the prev frame X and Z

  let finalFrameZComp = Math.cos(camRO) * VROInfluencedTrajectory;

  let finalFrameXComp = Math.sin(camRO) * VROInfluencedTrajectory;


  //step 3: Now you have the X and Z coords of the spot and already have the Y spot from earlier on in the function (prevFrameYComp)

  //step 4: moving from the cam center by the lengths found

  let projSpotStage1X = camCoords[0] + prevFrameXComp;
  let projSpotStage1Z = camCoords[2] + prevFrameZComp;

  let projSpotStage2X = projSpotStage1X + finalFrameXComp;
  let projSpotStage2Z = projSpotStage1Z + finalFrameZComp;

  let finalX = projSpotStage2X;
  let finalY = CCTPS_YDisp_PrevFrameYComp;
  let finalZ = projSpotStage2Z;

  //console.log("finalX: " + finalX + " ; finalY: " + finalY + " ; finalZ: " + finalZ);

 // drawCircle(SVcanvas, SVCTX, finalZ, finalY, "Orange");
  //drawCircle(TVcanvas, TVCTX, finalX, finalZ, "Blue");



  let cpCoords = findConvergencePoint();

 // TVCTX.beginPath();

 // TVCTX.strokeStyle = "red";
 // TVCTX.arc(cpCoords[0], cpCoords[2], 10, 0, 2 * Math.PI);
 // TVCTX.stroke();




  //finding projSpotToActualPointDist
  let psapXDisp = Math.abs(staticPX-finalX);
  let psapYDisp = Math.abs(staticPY-finalY);
  let psapZDisp = Math.abs(staticPZ-finalZ);

  //note: this appears to be correct
  let distProjSpotToActualPoint = Math.sqrt(Math.pow(psapXDisp, 2) + Math.pow(psapYDisp, 2) + Math.pow(psapZDisp, 2));

  //let distProjSpotToActualPoint = Math.sqrt(Math.pow((staticPX-finalX), 2) + (Math.pow((staticPY-finalY)), 2) + (Math.pow((staticPZ-finalZ)), 2));

  //finding projSpotToCPDist
  let pscpXDisp = Math.abs(cpCoords[0]-finalX);
  let pscpYDisp = Math.abs(cpCoords[1]-finalY);
  let pscpZDisp = Math.abs(cpCoords[2]-finalZ);

  let distProjSpotToConverencePoint = Math.sqrt(Math.pow(pscpXDisp, 2) + Math.pow(pscpYDisp, 2) + Math.pow(pscpZDisp, 2));


  //finding actualPointToConvergencePoint
  let aptcpXDisp = Math.abs(staticPX-cpCoords[0]);
  let aptcpYDisp = Math.abs(staticPY-cpCoords[1]);
  let aptcpZDisp = Math.abs(staticPZ-cpCoords[2]);

  let distActualPointToCP = Math.sqrt(Math.pow(aptcpXDisp, 2) + Math.pow(aptcpYDisp, 2) + Math.pow(aptcpZDisp, 2));




  //refraction angle
  let A = distProjSpotToActualPoint;
  let B = distProjSpotToConverencePoint;
  let C = distActualPointToCP;

  let ASquared = Math.pow(A, 2);
  let BSquared = Math.pow(B, 2);
  let CSquared = Math.pow(C, 2);

  let combinedCalc = (BSquared - ASquared - CSquared) / (-2*(A*C));
  let refractionAngle = Math.acos(combinedCalc);



  //now to get the refractionDV
  //this is the mixed vector (which has a x and y). We need to break it down. Use the projected points to help break it down (not the static point coords)
  let refractionDVMixed = Math.tan(refractionAngle) * A;


  //testing
  //shootRay(TVcanvas, TVCTX, staticPX, staticPZ, 0.5, 3, "Green");


  let projSpotLocalBearing = Math.atan((py/px));

  //console.log("refractionMixed: " + refractionDVMixed + " {point: " + staticPX, + " , " + staticPY + ", " + staticPZ);


  let refractionXDisp = Math.cos(projSpotLocalBearing) * refractionDVMixed;
  let refractionYDisp = Math.sin(projSpotLocalBearing) * refractionDVMixed;

  let finalXPos = px + refractionXDisp;
  let finalYPos = py + refractionYDisp;

  return [finalXPos, finalYPos];













  function findConvergencePoint(){

    let cpX = camKHat[0] * -1;
    let cpY = camKHat[1] * -1;
    let cpZ = camKHat[2] * -1;

    cpX = cpX + camCoords[0];
    cpY = cpY + camCoords[1];
    cpZ = cpZ + camCoords[2];

    //experimental
    cpX = cpX * -1;

    return [cpX, cpY, cpZ];



  }



}


//Will take in a point (after projection) and then displace its coordinates by a convergence function
//px py and pz stand for the x,y and z coords of the point that is to be passed in here
//StaticPX stands for the static coordinates of the point in the 3D world (unaffected by camera movements)
function applyConvergenceLens(px, py, pz, StaticPX, StaticPY, StaticPZ){

  //step 1: get DistFromInherentProjectionsSpotToTriangleVector (draw a perpendicular line from the triangle's vector to where it lands on the cam)
    //first get distFromCamCenterToProjSpot (Pythagorean)
    //2 value array
    let camLocalProjSpot = [];
    camLocalProjSpot[0] = px + camScreenDV[0];
    camLocalProjSpot[1] = py + camScreenDV[1];




    //necessary for calc (DCCPS: Dist from cam center to proj spot)
    let LocalDCCPS = Math.sqrt(Math.pow(camLocalProjSpot[0],2) + Math.pow(camLocalProjSpot[1], 2));

    if(toggleSwitch_lens_CCToProjSpot==true){
      shootRay(TVcanvas, TVCTX, camCoords[0], camCoords[2], camRO, LocalDCCPS, "Red");
    }

    //next get directDistFromCamCenterToPoint (the triangl vector point) (DDCCP)
    //use pythgorean for x, y, and z dispacements of point
    let DDCCP;
    let DDCCPXDisp = StaticPX - camCoords[0];
    let DDCCPYDisp = StaticPY - camCoords[1];
    let DDCCPZDisp = StaticPZ - camCoords[2];



    //necessary for calc (Direct Distance Cam Center To Point)
    DDCCP = Math.sqrt(Math.pow(DDCCPXDisp, 2) + Math.pow(DDCCPYDisp, 2) + Math.pow(DDCCPZDisp, 2));



    //now we need to calculate the 3D real coordinates of the projection spot. We can use this using the DCCPS, camROHorz, camROVert

  //Remember we are finding the coordinates here (not the distance length)
  let PRJSX = Math.cos(camRO) * ( camCoords[0] + camScreenDV[0] + px );

  let PRJSZ = camCoords[2] + (Math.tan(camRO) * (PRJSX-camCoords[0]));
  let PRJSY = (Math.cos(camROVert)) * ( camCoords[1] + camScreenDV[1] + py);
  PRJSY = camCoords[1] + (Math.tan(camROVert) * (PRJSZ-camCoords[1]));
  PRJSY = camCoords[1] + (PRJSZ/(Math.tan(camROVert)));

  //now factoring in the camROVert to all the coordinates
  //On the X-axis
  PRJSY = camCoords[1] + (((camScreenDV[1]+py)-camCoords[1])*Math.cos(camROVert));




  //compensating for VRO (Z-axis disp)
  let vroZDisp = Math.sin(camROVert) * (camScreenDV[1]+py+camCoords[1]);
  PRJSZ = PRJSZ + vroZDisp;

  //console.log("Watermelon: PRJSX: " + PRJSX + " ; PRJSY: " + PRJSY + " ; PRJSZ: " + PRJSZ);


  //Visual Testing start (this is just confirming on the panels of the locations of the coords)
  let PRJSXZConverted = getCanvasCoordsOfActualCoordsImproved(TVcanvas, PRJSX, PRJSZ);
  let PRJSXConverted = PRJSXZConverted[0];
  let PRJSZConverted = PRJSXZConverted[1];

  //running through a polarity check to dedcide to reverse polarity if the original vals were negative
  //if(PRJSX < 0){PRJSXConverted = PRJSXConverted * -1;}

  //if(PRJSZ < 0){PRJSZConverted = PRJSZConverted * -1;}

  //TVCTX.beginPath();

 // TVCTX.strokeStyle = "Yellow";
 // TVCTX.arc(PRJSXConverted, PRJSZConverted, 10, 0, 2 * Math.PI);
 // TVCTX.stroke();

  let PRJSXYConverted = getCanvasCoordsOfActualCoordsImproved(SVcanvas, PRJSX, PRJSY);
  let PRJSYConverted = PRJSXYConverted[1];

  //if(PRJSY < 0){PRJSYConverted = PRJSYConverted * -1;}

  //console.log("Converted XYZ: " + PRJSXConverted + " , " + PRJSYConverted + " , " + PRJSZConverted);

  //Drawing the projection spot on the SV
  let testZ = PRJSZ;
  let testY = PRJSY;
  let testCoords = getCanvasCoordsOfActualCoordsImproved(SVcanvas, testZ, testY);
  //SVCTX.beginPath();

  //SVCTX.strokeStyle = "Yellow";
  //SVCTX.arc(testCoords[0], testCoords[1], 10, 0, 2*Math.PI);
  //SVCTX.stroke();

  //Visual testing end




    /**
     * OLD METHOD DO NOT USE
    let PSRealXDisp = Math.cos(camRO) * DDCCPXDisp;
    let PSRealYDisp = Math.sin(camRO) * DDCCPXDisp;
    //note I'm not sure about this. So verify if you have to use Tan.
    let PSRealZDisp = Math.tan(camROVert) * DDCCPXDisp;
    */










}

function applyConvergenceLensInverseCamHatSeq(px, py, pz, staticPX, staticPY, staticPZ){

  let projSpotX = (px * (camIHat[0]*-1)) + (py * (camJHat[0]*-1)) + (pz * (camKHat[0]*-1));

  let projSpotY = (px * (camIHat[1]*-1)) + (py * (camJHat[1]*-1)) + (pz * (camKHat[1]*-1));

  let projSpotZ = (px * (camIHat[2]*-1)) + (py * (camJHat[2]*-1)) + (pz * (camKHat[2]*-1));

  projSpotX = projSpotX + camCoords[0];
  projSpotY = projSpotY + camCoords[1];
  projSpotZ = projSpotZ + camCoords[2];

  drawCircle(TVcanvas, TVCTX, projSpotX, projSpotZ, "Red");

}





//will return 2 numbers (in an array). The amount by which the point has to displace on the x axis and the amount by which the point has to displace on the y axis.
function applyConvergenceLensProjSpotHatsMethod(px, py, pz, staticPX, staticPY, staticPZ){

  let vecX = px;
  let vecY = py;
  let vecZ = 0;

  //console.log("unit test: py: " + py);

  updateProjSpotHats();

  //reversing it here at the source to draw it on the right spot
  vecX = vecX * 1;
  vecY = vecY * 1;
  vecZ = vecZ * 1;

  //for some bizarre reason I need to add 2 to the Y coord to make it line up with the proj spot in the side view
 // vecY = vecY + 2;


 // console.log("Unit test: projSpotJHat[0]: " + projSpotJHat[0]);
 // console.log("Unit test: projSpotJHat[1]: " + projSpotJHat[1]);
  //console.log("unit test: projSpotJHat[2]: " + projSpotJHat[2]);


  let finalVecX = (vecX*projSpotIHat[0]) + (vecY*projSpotJHat[0]) + (vecZ*projSpotKhat[0]);
  let finalVecY = (vecX*projSpotIHat[1]) + (vecY*projSpotJHat[1]) + (vecZ*projSpotKhat[1]);
  let finalVecZ = (vecX*projSpotIHat[2]) + (vecY*projSpotJHat[2]) + (vecZ*projSpotKhat[2]);



  displaceByCamCoords();

  console.log("--------------------------");
  console.log("Curent px: " + px + " ; Current py: " + py);
  console.log("FinalVecX: " + finalVecX);
  console.log("FinalVecY: " + finalVecY);
  console.log("FinalVecZ: " + finalVecZ);

  //finalVecX = finalVecX * -1;
  //finalVecY = finalVecY * -1;
  //finalVecZ = finalVecZ * -1;


  drawCircle(TVcanvas, TVCTX, finalVecX, finalVecZ, "Orange");
  drawCircle(SVcanvas, SVCTX, finalVecZ, finalVecY, "Orange");


  let convX = 0;
  let convY = 0;
  let convZ = camConvergenceAmount * -1;


  updateCamConvergencePoint();


 // drawCircle(TVcanvas, TVCTX, convX, convZ, "Lawngreen");

 // drawCircle(SVcanvas, SVCTX, convZ, convY, "Lawngreen");

  //Step 1 complete: We have the coordinates of the proj spot (finalVecX, finalVecY and finalVecZ)


  //Step 2: Get the coordinates of the convergence point of the camera (remember this also acts like a vector using the camera as the origin). During initialization it is placed behind theh camera.
  //We simply have to orient it with the camhats and then displace by camCoords

  /**
  let convergencePointX = (camConvergencePoint[0]*projSpotIHat[0]) + (camConvergencePoint[1]*projSpotJHat[0]) + (camConvergencePoint[2]*projSpotKhat[0]);

  let convergencePointY = (camConvergencePoint[0]*projSpotIHat[1]) + (camConvergencePoint[1]*projSpotJHat[1]) + (camConvergencePoint[2]*projSpotKhat[1]);

  let convergencePointZ = (camConvergencePoint[0]*projSpotIHat[2]) + (camConvergencePoint[1]*projSpotJHat[2]) + (camConvergencePoint[2]*projSpotKhat[2]);
  */
  //now displacing them by the camCoords
  //convergencePointX = convergencePointX + camCoords[0];
 // convergencePointY = convergencePointY + camCoords[1];
 // convergencePointZ = convergencePointZ + camCoords[2];

 // convergencePointX = convergencePointX * -1;
 // convergencePointY = convergencePointY * -1;
  //convergencePointZ = convergencePointZ * -1;



 // console.log("THE FINAL VEC Y IS: " + finalVecY);



 //step 3: now that we have the position of all the relevant points, time to find the lengths (A, B, C) according to the paper diagram (Finding refraction angles using law  of cosines).
 // 3.1: Find A. Dist between projspot and actual point

  let staticVec = [staticPX, staticPY, staticPZ];
  let projSpotVec_ccDisplaced = [finalVecX, finalVecY, finalVecZ];
  let camConvVec_transformed_ccDisplaced = [convX, convY, convZ];

  let refractionDispYZ = calcRefractionDispYZ(staticVec, projSpotVec_ccDisplaced, camConvVec_transformed_ccDisplaced);

  let refractionDispXZ = calcRefractionDispXZ(staticVec, projSpotVec_ccDisplaced, camConvVec_transformed_ccDisplaced);

  refractionDispYZ = refractionDispYZ * -1;
  refractionDispXZ = refractionDispXZ * -1;
  return [refractionDispXZ, refractionDispYZ, 0];

  function calcRefractionDispYZ(staticVec, projSpotVec, camConvVec){

    let SV_CCV = calcLineOnYZ_SV_CCV(staticVec, camConvVec);

    let SV_PJS = calcLineOnYZ_SV_PJS(staticVec, projSpotVec);

    let PJS_CCV = calcLineOnYZ_PJS_CCV(projSpotVec, camConvVec);

    /*
    console.log("SV_CCV " + SV_CCV);
    console.log("SV_PJS " + SV_PJS);
    console.log("PJS_CCV " + PJS_CCV);
    */

    let refYZ_ValToFindInverseCosOf = (((Math.pow(SV_PJS, 2) + Math.pow(SV_CCV, 2)) - (Math.pow(PJS_CCV, 2))) / (2 * SV_PJS * SV_CCV) );



    let refAngleYZ = Math.acos(refYZ_ValToFindInverseCosOf);


    let refYZ_deg = (180 / Math.PI) * refAngleYZ;

    console.log("refYZDeg: " + refYZ_deg);

    let refractionDisp_YZ = Math.tan(refAngleYZ) * SV_PJS;

    return refractionDisp_YZ;



    function calcLineOnYZ_SV_CCV(sv, ccv){

      //we are finding the length of this by considering the right angled triangle (the height of the triangle is the difference in y values and the length is the difference in z values)

      let height = sv[1] - ccv[1];
      height = Math.abs(height);


      let length = sv[2] - ccv[2];
      length = Math.abs(length);

      let hyp = Math.sqrt( Math.pow(height, 2) + Math.pow(length, 2) );

      return hyp;

    }

    function calcLineOnYZ_SV_PJS(sv, pjs){

      let height = sv[1] - pjs[1];
      height = Math.abs(height);

      let length = sv[2] - pjs[2];
      length = Math.abs(length);

      let hyp = Math.sqrt( Math.pow(height, 2) + Math.pow(length, 2) );

      return hyp;

    }

    function calcLineOnYZ_PJS_CCV(pjs, ccv){

      let height = pjs[1] - ccv[1];
      height = Math.abs(height);

      let length = pjs[2] - ccv[2];
      length = Math.abs(length);

      let hyp = Math.sqrt( Math.pow(height, 2) + Math.pow(length, 2) );

      return hyp;


    }




  }

  function calcRefractionDispXZ(staticVec, projSpotVec, camConvVec){

    let SV_CCV = calcLineOnXZ_SV_CCV(staticVec, camConvVec);

    let SV_PJS = calcLineOnXZ_SV_PJS(staticVec, projSpotVec);

    let PJS_CCV = calcLineOnXZ_PJS_CCV(projSpotVec, camConvVec);

    let refXZ_ValToFindInverseCosOf = (((Math.pow(SV_PJS, 2) + Math.pow(SV_CCV, 2)) - (Math.pow(PJS_CCV, 2))) / (2 * SV_PJS * SV_CCV));

    let refAngleXZ = Math.acos(refXZ_ValToFindInverseCosOf);

    let refXZ_deg = (180 / Math.PI) * refAngleXZ;

    console.log("refXZDeg: " + refXZ_deg);

    let refractionDisp_XZ = Math.tan(refAngleXZ) * SV_PJS;

    return refractionDisp_XZ;


    function calcLineOnXZ_SV_CCV(sv, ccv){

      let height = sv[2] - ccv[2];
      height = Math.abs(height);


      let length = sv[0] - ccv[0];
      length = Math.abs(length);

      let hyp = Math.sqrt(Math.pow(height, 2) + Math.pow(length, 2));

      return hyp;

    }

    function calcLineOnXZ_SV_PJS(sv, pjs){

      let height = sv[2] - pjs[2];
      height = Math.abs(height);

      let length = sv[0] - pjs[0];
      length = Math.abs(length);

      let hyp = Math.sqrt(Math.pow(height, 2) + Math.pow(length, 2));

      return hyp;



    }

    function calcLineOnXZ_PJS_CCV(pjs, ccv){

      let height = pjs[2] - ccv[2];
      height = Math.abs(height);

      let length = pjs[0] - ccv[0];
      length = Math.abs(length);

      let hyp = Math.sqrt(Math.pow(height, 2) + Math.pow(length, 2));

      return hyp;


    }

  }

  //***********************************

  let lineAXDist = (staticPX - finalVecX);
  let lineAYDist = (staticPY - finalVecY);
  let lineAZDist = (staticPZ - finalVecZ);

  let lineA = Math.sqrt(Math.pow(lineAXDist, 2) + Math.pow(lineAYDist, 2) + Math.pow(lineAZDist, 2));

  let lineCXDist = (staticPX - convX);
  let lineCYDist = (staticPY - convY);
  let lineCZDist = (staticPZ - convZ);

  let lineC = Math.sqrt(Math.pow(lineCXDist, 2) + Math.pow(lineCYDist, 2) + Math.pow(lineCZDist, 2));

  let lineBXDist = (finalVecX - convX);
  let lineBYDist = (finalVecY - convY);
  let lineBZDist = (finalVecZ - convZ);

  let lineB = Math.sqrt(Math.pow(lineBXDist, 2) + Math.pow(lineBYDist, 2) + Math.pow(lineBZDist, 2));


  let angleX = Math.acos(((Math.pow(lineB, 2)) - (Math.pow(lineA, 2)) - (Math.pow(lineC, 2))) / (-2 * lineA * lineC));






  shootRaySourceTowardsTarget(TVcanvas, TVCTX, staticPX, staticPZ, finalVecX, finalVecZ, lineA, "Orange");

  //console.log("staticPX: " + staticPX + " , staticPZ: " + staticPZ + " , finalVecX: " + finalVecX + " , finalVecZ: " + finalVecZ + " ; lineA: " + lineA);

  shootRaySourceTowardsTarget(TVcanvas, TVCTX, finalVecX, finalVecZ, convX, convZ, lineB, "Lawngreen");

  shootRaySourceTowardsTarget(TVcanvas, TVCTX, staticPX, staticPZ, convX, convZ, lineC, "Lawngreen");
  //console.log("angleX: " + angleX);




  let angleXInDegrees = (180/Math.PI) * angleX;
 // console.log("ANGLEX: " + angleXInDegrees);

  //testing the lengths
  /**
  shootRay(TVcanvas, TVCTX, staticPX, staticPZ, -(camRO+((Math.PI/2)*2)), lineA, "White");
  shootRay(TVcanvas, TVCTX, finalVecX, finalVecZ, -(camRO+((Math.PI/2)*2)) + ((Math.PI/2)/2), lineB, "Lawngreen");
  shootRay(TVcanvas, TVCTX, staticPX, staticPZ, -(camRO+((Math.PI/2)*2)) + ((Math.PI/2)/8), lineC, "Blue");
  */

  let refractionDV = Math.tan(angleX) * lineA;

 // console.log("refractionDV: " + refractionDV);


  shootRaySourceTowardsTarget(TVcanvas, TVCTX, finalVecX, finalVecZ, camCoords[0], camCoords[2], refractionDV, "White");


  //experimental. We have to make the DV dependent on lineA
 // refractionDV = refractionDV * (1/lineA);





  //to break downw the refractionDV into x and y we can probably use the projected x and y points to find out the angle

  let CSXAxisToPointAngle = findCSXAxisToPointAngle();
 // CSXAxisToPointAngle = Math.abs(CSXAxisToPointAngle);


  let csxDeg = (180/Math.PI) * CSXAxisToPointAngle;

 // console.log("csxDeg: " + csxDeg);

 // console.log("CSXAxisToPointAngle: " + CSXAxisToPointAngle);

 // console.log("refractionDV: " + refractionDV);
 // console.log("CSXAxisToPointAngle: " + CSXAxisToPointAngle);


  //experimental:
 // CSXAxisToPointAngle = Math.abs(CSXAxisToPointAngle);
 // refractionDV = Math.abs(refractionDV);

  //refractionDV = refractionDV * -1;
  //refractionDV = refractionDV * lineA;


  //maybe you should reverse polarity depending on which quadrant you are in?
  let refractionDVXDisp = Math.cos(CSXAxisToPointAngle) * refractionDV;
  let refractionDVYDisp = Math.sin(CSXAxisToPointAngle) * refractionDV;


 // console.log("rfcx: " + refractionDVXDisp + " ; rfxy: " + refractionDVYDisp + " totalrdv: " + refractionDV);

  //console.log("rdvXD: " + refractionDVXDisp);
 // console.log("rdvYD: " + refractionDVYDisp);
 // console.log("refDVX: " + refractionDVXDisp  + " , refDVY: " + refractionDVYDisp);


 // let results = polarityChanger(refractionDVXDisp, refractionDVYDisp, px, py);

 // refractionDVXDisp = results[0];
 // refractionDVYDisp = results[1];

  refractionDVXDisp = refractionDVXDisp * -1;
  refractionDVYDisp = refractionDVYDisp * -1;

  //refractionDVXDisp = refractionDVXDisp * (lineA);
  //refractionDVYDisp = refractionDVYDisp * (lineA);

  //console.log("carrot: refractionDVXDisp: " + refractionDVXDisp + " , refractionDVYDisp: " + refractionDVYDisp);

  //reducing magnitude by subtraction
  //Note: this is causing more problems so dont do it
 // refractionDVXDisp = refractionDVXDisp - 0.5;
  //refractionDVYDisp = refractionDVYDisp - 0.5;


  //refractionDVXDisp = refractionDVXDisp * -1;
  //refractionDVYDisp = refractionDVYDisp * -1;


  //inversifying
  //this would depend on which quadrant it is in
  /**
  if(refractionDVXDisp>0) {
    refractionDVXDisp = refractionDVXDisp * -1;
  }



  if(refractionDVYDisp>0) {
    refractionDVYDisp = refractionDVYDisp * -1;
  }
   */
  /**
  refractionDVXDisp = refractionDVXDisp * -1;
  refractionDVYDisp = refractionDVYDisp * -1;
  */



 // console.log("RX: " + refractionDVXDisp + " , RY: " + refractionDVYDisp + " , lineA: " + lineA + " ; totalRDV: " + refractionDV);

  //making it dependent on z val
 // refractionDVXDisp = refractionDVXDisp * (lineA);
  //refractionDVYDisp = refractionDVYDisp * (lineA);

/**
  //now changing polarity based on quadrant:
  //top left
  if(px < 0 && py > 0){
    refractionDVYDisp = refractionDVYDisp * -1;
  }

  //top right
  else if(px >= 0 && py >= 0){
    refractionDVXDisp = refractionDVXDisp * -1;
    refractionDVYDisp = refractionDVYDisp * -1;
  }

  //bottom-right
  else if(px >= 0 && py < 0){
    refractionDVXDisp = refractionDVXDisp * -1;
  }
  */
  /**
  //bottom left
  else if(px < 0 && py < 0){

  }
   */






  //reducing magnitude
  //refractionDVXDisp = refractionDVXDisp / 2;
  //refractionDVYDisp = refractionDVYDisp / 2;





  return[refractionDVXDisp, refractionDVYDisp, refractionDV];





  //Will find the angle between the local X-axis of the camera screen and the projected point. If the projected point is directly on the x axis, this angle is 0.
  //Note we have to check which quadrant we are on because Opp and Adj will be different based on that
  function findCSXAxisToPointAngle(){

    let angleY;




    //we have to add the CSDV because this is how we get the final distance between the current camhats (after displacement) and the projected points
    //Note that this is probably wrong because are measuring the dist to the cam center. So CSDV is irrelevant.
    //let opp = py + Math.abs(camScreenDV[1]);
    //let adj = px + Math.abs(camScreenDV[0]);

    let opp = py;
    let adj = px;

   // console.log("opp: " + opp + " adj: " + adj);


    //tan(angleX) = opp/adj

    angleY = Math.atan(opp/adj);
    //console.log("adj: " + adj + " , opp: " + opp + " ; angleX: " + angleX);

    let angleYDeg = (180/Math.PI) * angleY;

    angleYDeg = Math.abs(angleYDeg);

   // console.log("angleXDeg: " + angleXDeg);


   // console.log("AngleXDeg: " + angleXDeg);

   // console.log("CSX: opp: " + opp + " , adj: " + adj);
   // console.log("CSX: angle Deg: " + angleXDeg);



    return angleY;
  }

  //will return new values for the xDisp and yDisp in an array
  function polarityChanger(rfx, rfy, xOrg, yOrg){

    //m stands for modified

    let mx = Math.abs(rfx);
    let my = Math.abs(rfy);

    //right
    if(xOrg > 0){

      //right top
      if(yOrg > 0){

        mx = mx * -1;
        my = my * -1;
      //  console.log("Top right quadrant: ");
        return [mx, my];
      }

      //right bottom
      if(yOrg < 0){
        mx = mx * -1;
        my = my * 1;
      //  console.log("Bottom right quadrant: ");
        return [mx, my];
      }

    }


    //left
    if(xOrg < 0){

      //left top
      if(yOrg > 0){
        mx = mx * 1;
        my = my * -1;
      //  console.log("Top left quadrant: ");
        return [mx, my];
      }

      //left bottom
      if(yOrg < 0){
        mx = mx * 1;
        my = my * 1;
      //  console.log("Bottom left quadrant: ");
        return [mx, my];

      }

    }


  }


  function updateProjSpotHats(){

     /*
     finalVecX = (vecX*projSpotIHat[0]) + (vecY*projSpotJHat[0]) + (vecZ*projSpotKhat[0]);
     finalVecY = (vecX*projSpotIHat[1]) + (vecY*projSpotJHat[1]) + (vecZ*projSpotKhat[1]);
     finalVecZ = (vecX*projSpotIHat[2]) + (vecY*projSpotJHat[2]) + (vecZ*projSpotKhat[2]);

    drawCircle(TVcanvas, TVCTX, finalVecX, finalVecZ, "white");
    drawCircle(SVcanvas, SVCTX, finalVecZ, finalVecY, "white");
    */

    // console.log("Unit Test UPSH: ProjSpotJHat (before horz stage): " + projSpotJHat[0] + ", " + projSpotJHat[1] + " ," + projSpotJHat[2]);

    //await sleep(1000);

    //horz stage
    projSpotIHat[0] = (Math.cos(camRO));
    projSpotIHat[2] = (Math.sin(camRO));

    /*
     finalVecX = (vecX*projSpotIHat[0]) + (vecY*projSpotJHat[0]) + (vecZ*projSpotKhat[0]);
     finalVecY = (vecX*projSpotIHat[1]) + (vecY*projSpotJHat[1]) + (vecZ*projSpotKhat[1]);
     finalVecZ = (vecX*projSpotIHat[2]) + (vecY*projSpotJHat[2]) + (vecZ*projSpotKhat[2]);

    drawCircle(TVcanvas, TVCTX, finalVecX, finalVecZ, "green");
    drawCircle(SVcanvas, SVCTX, finalVecZ, finalVecY, "green");
    */


    //await sleep(2000);


    //JHat stage (this section needs some configuring) from the color circle test, it seems like the y invert is happeing here
    projSpotJHat[1] = (Math.cos(camROVert));
    let jRed = (Math.sin(camROVert));
    //It kind of makes sense to turn this negative because the X turns are inverted
    projSpotJHat[0] = ((Math.sin(camRO)) * jRed);
    projSpotJHat[2] = -(Math.cos(camRO)) * jRed;

    // console.log("Unit Test UPSH: ProjSpotJHat (after horz stage): " + projSpotJHat[0] + ", " + projSpotJHat[1] + " ," + projSpotJHat[2]);

      /*
     finalVecX = (vecX*projSpotIHat[0]) + (vecY*projSpotJHat[0]) + (vecZ*projSpotKhat[0]);
     finalVecY = (vecX*projSpotIHat[1]) + (vecY*projSpotJHat[1]) + (vecZ*projSpotKhat[1]);
     finalVecZ = (vecX*projSpotIHat[2]) + (vecY*projSpotJHat[2]) + (vecZ*projSpotKhat[2]);

    drawCircle(TVcanvas, TVCTX, finalVecX, finalVecZ, "blue");
    drawCircle(SVcanvas, SVCTX, finalVecZ, finalVecY, "blue");
    */
   // await sleep(2000);

    //KHat stage
    let projSpotKHat_XDisp = -(Math.sin(camRO));
    let projSpotKHat_ZDisp = (Math.cos(camRO));

    let projSpotKHat_XDisp_XDisp = Math.cos(camROVert) * projSpotKHat_XDisp;
    let projSpotKHatRed = projSpotKHat_XDisp_XDisp / Math.sin(camRO);
    let projSpotKHatYDisp = Math.tan(camROVert) * projSpotKHatRed;
    let projSpotZDisp_ZDisp = Math.cos(camROVert) * projSpotKHat_ZDisp;

    projSpotKhat[0] = projSpotKHat_XDisp_XDisp;
    projSpotKhat[2] = projSpotZDisp_ZDisp;

    projSpotKhat[1] = (Math.sin(camROVert));

    /*
    finalVecX = (vecX*projSpotIHat[0]) + (vecY*projSpotJHat[0]) + (vecZ*projSpotKhat[0]);
    finalVecY = (vecX*projSpotIHat[1]) + (vecY*projSpotJHat[1]) + (vecZ*projSpotKhat[1]);
    finalVecZ = (vecX*projSpotIHat[2]) + (vecY*projSpotJHat[2]) + (vecZ*projSpotKhat[2]);

    drawCircle(TVcanvas, TVCTX, finalVecX, finalVecZ, "purple");
    drawCircle(SVcanvas, SVCTX, finalVecZ, finalVecY, "purple");
    */

    console.log("PROJSPOT: PJ-I^[0]: " + projSpotIHat[0] + " ,  PJ-I^[1]: " + projSpotIHat[1] + " ; PJ-I^[2]: " +  projSpotIHat[2]);
    console.log("PROJSPOT: PJ-J^[0]: " + projSpotJHat[0] + " ,  PJ-J^[1]: " + projSpotJHat[1] + " ; PJ-J^[2]: " +  projSpotJHat[2]);
    console.log("PROJSPOT: PJ-K^[0]: " + projSpotKhat[0] + " ,  PJ-K^[1]: " + projSpotKhat[1] + " ; PJ-K^[2]: " +  projSpotKhat[2]);

  }




  function displaceByCamCoords(){

    finalVecX = finalVecX + camCoords[0];
    finalVecY = (finalVecY + camCoords[1]);
    finalVecZ = finalVecZ + camCoords[2];

  }


  function updateCamConvergencePoint(){


  /**
     convZ = camConvergenceAmount * Math.cos(camRO);
     convZ = convZ * -1;
  */

  //experimental
    /*
  projSpotIHat[0] = projSpotIHat[0] * -1;
  projSpotIHat[1] = projSpotIHat[1] * -1;
  projSpotIHat[2] = projSpotIHat[2] * -1;

  projSpotJHat[0] = projSpotJHat[0] * -1;
  projSpotJHat[1] = projSpotJHat[1] * -1;
  projSpotJHat[2] = projSpotJHat[2] * -1;

     */

 // projSpotKhat[0] = projSpotKhat[0] * -1;
 // projSpotKhat[1] = projSpotKhat[1] * -1;
 // projSpotKhat[2] = projSpotKhat[2] * -1;






   convX = (convX*projSpotIHat[0]) + (convY*projSpotJHat[0]) + (convZ*projSpotKhat[0]);

   convY = (convX*projSpotIHat[1]) + (convY*projSpotJHat[1]) + (convZ*projSpotKhat[1]);

   convZ = (convX*projSpotIHat[2]) + (convY*projSpotJHat[2]) + (convZ*projSpotKhat[2]);



     //inversifying channel
   //  convX = convX * -1;

     //convY = convY * -1;


     //displacing by camCoords
    convX = convX + camCoords[0];
    convY = convY + camCoords[1];
    convZ = convZ + camCoords[2];


    console.log("Now finding the convergence point: convX: " + convX + " ; convY: "  +convY + " ; convZ: " + convZ);




    drawCircle(TVcanvas, TVCTX, convX, convZ, "Grey");
    drawCircle(SVcanvas, SVCTX, convZ, convY, "Grey");
    //now we have to displace them by taking into account HRO and VRO

   // convX = convX + (Math.sin(camRO)*camConvergenceAmount);


  }


}





//<<end of camV draw functions>>

//<<start of SV draw functions>>

function drawGridSV(){

  var columnUnitLength = SVcanvas.width / gridColumns;
  var rowUnitLength = SVcanvas.height / gridRows;

  SVCTX.strokeStyle = "Grey";

  for(let x=0; x<=SVcanvas.width; x=x+columnUnitLength){

    if(x==SVcanvas.width/2){x=x+columnUnitLength;}

    SVCTX.beginPath();
    SVCTX.moveTo(x, 0);
    SVCTX.lineTo(x, SVcanvas.height);
    SVCTX.stroke();

  }

  for(y=0; y<=SVcanvas.height; y=y+rowUnitLength){

    if(y==SVcanvas.height/2){y=y+rowUnitLength;}

    SVCTX.beginPath();
    SVCTX.moveTo(0, y);
    SVCTX.lineTo(SVcanvas.width, y);
    SVCTX.stroke();
  }

  //drawing the axis

  SVCTX.strokeStyle = "Red";

  SVCTX.beginPath();
  SVCTX.moveTo(SVcanvas.width/2, 0);
  SVCTX.lineTo(SVcanvas.width/2, SVcanvas.height);
  SVCTX.stroke();


  SVCTX.beginPath();
  SVCTX.moveTo(0, SVcanvas.height/2);
  SVCTX.lineTo(SVcanvas.width, SVcanvas.height/2);
  SVCTX.stroke();



}


function drawCamSV(){

  //x(SV) is z(Cam)
  //y(SV) is y(Cam)

  SVCTX.strokeStyle = "Orange";

  let convertedCoordsCamOrigin = getCanvasCoordsOfActualCoords(camCoords[2], camCoords[1]);

  SVCTX.beginPath();
  SVCTX.moveTo(convertedCoordsCamOrigin[0], convertedCoordsCamOrigin[1]);

//  console.log("CCCO[0]: " + convertedCoordsCamOrigin[0]);
 // console.log("CCC[1]: " + convertedCoordsCamOrigin[1]);

  let convertedCoordsDestTopSide = getCanvasCoordsOfActualCoords((camCoords[2]+(Math.sin(camROVert)*(camHeight/2))), (camCoords[1]+(Math.cos(camROVert)*(camHeight/2))));

  SVCTX.lineTo((convertedCoordsDestTopSide[0]), (convertedCoordsDestTopSide[1]));
  SVCTX.stroke();

  SVCTX.strokeStyle = "Green";

  SVCTX.beginPath();
  SVCTX.moveTo(convertedCoordsCamOrigin[0], convertedCoordsCamOrigin[1]);

  //Apple (Are you sure the Xcoord of the DestBottomSide is camCoords[2]-(..) and not camCoords[2]+(..)). It seems like you have to add it, not subtract it.
  let convertedCoordsDestBottomSide = getCanvasCoordsOfActualCoords(camCoords[2]-(Math.sin(camROVert)*(camHeight/2)), camCoords[1]-(Math.cos(camROVert)*(camHeight/2)));

  SVCTX.lineTo(convertedCoordsDestBottomSide[0], convertedCoordsDestBottomSide[1]);
  SVCTX.stroke();


  //drawing the pole
  SVCTX.strokeStyle = "#00eaff";
  SVCTX.beginPath();
  SVCTX.moveTo(convertedCoordsCamOrigin[0], convertedCoordsCamOrigin[1]);

  //let convertedCoordsCenterPole = getCanvasCoordsOfActualCoords(camCoords[2]+(Math.cos(camROVert)), camCoords[1]+(Math.sin(camROVert)));
  let convertedCoordsCenterPole = getCanvasCoordsOfActualCoords(camCoords[2]+(Math.cos(camROVert)), camCoords[1]-(Math.sin(camROVert)));

  SVCTX.lineTo(convertedCoordsCenterPole[0], convertedCoordsCenterPole[1]);
  SVCTX.stroke();
}

function drawWorldHatsSV(){

  //drawing worldIHat
//  drawLineFCImprovedDashed(SVcanvas, SVCTX, 0, 0, worldIHat[2], worldIHat[1]);
  drawLineFC(SVCTX, 0, 0, worldIHat[2], worldIHat[1], "Orange");
  fillTextFC(SVCTX, worldIHat[2], worldIHat[1], "Orange", "WI^");


//  drawLineFCImproved(SVcanvas, SVCTX, 0, 0, worldJHat[2], worldJHat[1]);
  drawLineFC(SVCTX, 0, 0, worldJHat[2], worldJHat[1], "Orange");
  fillTextFC(SVCTX, worldJHat[2], worldJHat[1], "Orange", "WJ^");




 // drawLineFCImproved(SVcanvas, SVCTX, 0, 0, worldKhat[2], worldKhat[1]);
  drawLineFC(SVCTX, 0, 0, worldKhat[2], worldKhat[1], "Orange");
  fillTextFC(SVCTX, worldKhat[2], worldKhat[1], "Orange", "WK^");

}

function drawCamHatsSV(){

  drawLineFC(SVCTX, 0, 0, camIHat[2], camIHat[1], "Blue");
  fillTextFC(SVCTX, camIHat[2], camIHat[1], "Blue", "CI^");

  drawLineFC(SVCTX, 0, 0, camJHat[2], camJHat[1], "Red");
  fillTextFC(SVCTX, camJHat[2], camJHat[1], "Red", "CJ^");

  drawLineFC(SVCTX, 0, 0, camKHat[2], camKHat[1], "Green");
  fillTextFC(SVCTX, camKHat[2], camKHat[1], "Green", "CK^");



}


function drawCamDistToOriginSV(){
  drawLineFCImprovedDashed(SVcanvas, SVCTX, 0, 0, camCoords[2], camCoords[1], "Blue");
}


//will draw a dotted line from the camHats to the camera screen, which will land on the spot that marks the tail of the camScreenDV
function drawCamNormalsSV(){

  //step 1: calculate distance from camCenter to camHatsCenter
  //first calculating the distance from cam to origin
  //use pythagorean theorem
  let camDistSquared = Math.pow(camCoords[2],2) + Math.pow(camCoords[1],2);
  let camDist = Math.sqrt(camDistSquared);


  //step 2: Now that you're at the CamCenter, compensate for the CamScreenDV.

  //wait a minute, Just straight away find the dest coords, it was pointless to calculate the dist
  //x:cc[2]  + (sin(VRO)*CamScreenDV[1])
  //y:cc[1]  + (cos(VRO)*CamScreenDV[1])

  let camScreenDVVirtualXCoord = camCoords[2] + (Math.sin(camROVert)*camScreenDV[1]);
  let camScreenDVVirtualYCoord = camCoords[1] + ((Math.cos(camROVert))*camScreenDV[1]);

  drawLineFCImprovedDashed(SVcanvas, SVCTX, 0, 0, camScreenDVVirtualXCoord, camScreenDVVirtualYCoord, "Green");





}

function drawProjectionRaysTrianglesSVStrong(){

  if(projectionRaysSVStrongToggleSwitch==true){

    for(let t=0; t<trianglesArr.length; t=t+1){

      for(let p=0; p<trianglesArr[t].length; p=p+1){

        shootRay(SVcanvas, SVCTX, trianglesArr[t][p][0], trianglesArr[t][p][2], (camROVert)-(Math.PI/2), 10, "Red");

      }

    }


  }



}



function drawProjectionRaysSVStrong(){

  if(projectionRaysSVStrongToggleSwitch == true){
    drawProjectionRaysWorldHatsSVRayShootMethod();
    drawProjectionRaysCamHatsSVRayShootMethod();
  }

  //inner function
  function drawProjectionRaysCamHatsSVRayShootMethod(){

    shootRay(SVcanvas, SVCTX, camIHat[2], camIHat[1], camROVert-(Math.PI)/2, 10, "Blue");

    shootRay(SVcanvas, SVCTX, camJHat[2], camJHat[1], camROVert-(Math.PI)/2, 10, "Red");

    shootRay(SVcanvas, SVCTX, camKHat[2], camKHat[1], camROVert-(Math.PI)/2, 10, "Yellow");


  }


  //inner function
  function drawProjectionRaysWorldHatsSVRayShootMethod(){

    //dealing with worldI^
    //might have to turn camRO negative here
    shootRay(SVcanvas, SVCTX, worldIHat[2], worldIHat[1], camROVert-(Math.PI)/2, 10, "Orange");

    shootRay(SVcanvas, SVCTX, worldJHat[2], worldJHat[1], camROVert-(Math.PI)/2, 10, "Orange");

    shootRay(SVcanvas, SVCTX, worldKhat[2], worldKhat[1], camROVert-(Math.PI)/2, 10, "Orange");


  }



}



//<<end of SV draw functions>>






//END OF DRAW FUNCTIONS

//START OF JOYSTICK FUNCTIONS
function applyJoystick(event){

  let jCan = document.getElementById("joystickCanvas");
  let jctx = jCan.getContext('2d');

  jctx.clearRect(0, 0, jCan.width, jCan.height);

  document.getElementById("joystick").style.background = "radial-gradient(#ff4f7b 10%, #ff4f7b 20%, red 70%)";
  //document.getElementById("joystick").style.boxShadow =  "1px 1px 2px 2px red, -1px -1px 2px 2px red";

  camRO = 0;
  camROVert = 0;


    var quadrantNum = checkQuadrant();

    //drawMouseCrosshair();

 // console.log("quadrantNum: " + quadrantNum );

    switch (quadrantNum){

      case 1: applyPitchDownAndYawLeft(); break;
      case 2: applyPitchDownAndYawRight(); break;
      case 3: applyPitchUpAndYawRight(); break;
      case 4: applyPitchUpAndYawLeft(); break;

    }







    function checkQuadrant(){
        var XPos = event.offsetX;
        var YPos = event.offsetY;

        let quadrantNum = 0;

        if(XPos < 50){
          if(YPos < 50){
            quadrantNum = 1;
          }

          else{
            quadrantNum = 4;
          }
        }

        if(XPos > 50){

          if(YPos < 50){
            quadrantNum = 2;
          }

          else{
            quadrantNum = 3;
          }

        }


        return quadrantNum;

    }



    function applyPitchDownAndYawLeft(){



        let oppLen = 50 - event.offsetX;
        let adjLen = 50 - event.offsetY;

        let yawLeftIntensity = oppLen / 100;
        let pitchDownIntensity = adjLen / 100;

    //  console.log("yawLeftIntensity: " + yawLeftIntensity);
     // console.log("pitchDownIntensity: " + pitchDownIntensity);

        rotateCamLeft(yawLeftIntensity);
        rotateCamDown(pitchDownIntensity);

    }


    function applyPitchDownAndYawRight(){
      let oppLen = event.offsetX - 50;
      let adjLen = 50 - event.offsetY;

      let yawRightIntensity = oppLen / 100;
      let pitchDownIntensity = adjLen / 100;

      rotateCamRight(yawRightIntensity);
      rotateCamDown(pitchDownIntensity);


    }

    function applyPitchUpAndYawRight(){
      let oppLen = event.offsetX - 50;
      let adjLen = 50 - event.offsetY;

      let yawRightIntensity = oppLen / 100;
      let pitchUpIntensity = adjLen / 100;

      rotateCamRight(yawRightIntensity);
      rotateCamDown(pitchUpIntensity);

    }


    function applyPitchUpAndYawLeft(){
      let oppLen = event.offsetX - 50;
      let adjLen = 50 - event.offsetY;

      let yawLeftIntensity = oppLen / 100;
      let pitchUpIntensity = adjLen / 100;

      rotateCamRight(yawLeftIntensity);
      rotateCamDown(pitchUpIntensity);



    }

  //will draw a marker to indicate where the mouse is
  function drawMouseCrosshair(){
      let xPos = event.offsetX;
      let yPos = event.offsetY;

      jctx.beginPath();
      jctx.strokeStyle = "brown";
      jctx.lineWidth = 2;
      jctx.moveTo(xPos-5, yPos);
      jctx.lineTo(xPos+5, yPos);
      jctx.stroke();

      jctx.beginPath();
      jctx.strokeStyle = "brown";
      jctx.lineWidth = 2;
      jctx.moveTo(xPos, yPos-5);
      jctx.lineTo(xPos, yPos+5);
      jctx.stroke();



  }

}







function activateJoystickActiveSwitch(){

  document.getElementById("joystickCanvas").addEventListener("mousemove", applyJoystick);

  document.getElementById("joystick").addEventListener("mouseleave", function(){
    document.getElementById("joystick").style.background = "black";

  });


  if(joystickActiveSwitch==false){
    joystickActiveSwitch = true;
    document.getElementById("joystickActivateButtonIndicatorLight").style.background =  "radial-gradient(#ff4f7b 10%, #ff4f7b 20%, red 70%)";
    document.getElementById("joystickActivateButtonIndicatorLight").style.boxShadow = "1px 1px 2px 2px red, -1px -1px 2px 2px red";

    document.getElementById("joystickActiveTextIndicator").style.color = "Lawngreen";
  }

  else{
    joystickActiveSwitch = false;
  }

  updateWarningsPanel();

}

//END OF JOYSTICK FUNCTIONS


//START OF ACTION FUNCTIONS

function rotateCamRight(amount){

  camRO = camRO - amount;

  //add horzRotMatrix to rotMatrixStack
  //rotMatrixStack[rotMatrixStackIndex] = "Horz";
 // rotMatrixStackIndex = rotMatrixStackIndex + 1;


  //updateCamHatsHorz();

  //updateCamHatsMulti();

  updateCamHatsSequential();


  updateCamViewScope();

  calculateCamScreenDV();

  TVCTX.clearRect(0, 0, TVcanvas.width, TVcanvas.height);
  CamVCTX.clearRect(0, 0, CamVCanvas.width, CamVCanvas.height);
  SVCTX.clearRect(0, 0, SVcanvas.width, SVcanvas.height);

  renderTV();
  renderCamV();
  renderSV();

}


function rotateCamLeft(amount){

  camRO = camRO + amount;

  //add horzRotMatrix to rotMatrixStack
 // rotMatrixStack[rotMatrixStackIndex] = "Horz";
 // rotMatrixStackIndex = rotMatrixStackIndex + 1;


 // updateCamHatsHorz();

 // updateCamHatsMulti();

  updateCamHatsSequential();



  updateCamViewScope();

  calculateCamScreenDV();



  TVCTX.clearRect(0, 0, TVcanvas.width, TVcanvas.height);
  CamVCTX.clearRect(0, 0, CamVCanvas.width, CamVCanvas.height);
  SVCTX.clearRect(0, 0, SVcanvas.width, SVcanvas.height);

  renderTV();
  renderCamV();
  renderSV();


}

function rotateCamUp(amount){

  camROVert = camROVert - amount;

 // updateCamHatsVert();

  //updateCamHatsMulti();

  updateCamHatsSequential();

  updateCamViewScope();

  calculateCamScreenDV();

  TVCTX.clearRect(0, 0, TVcanvas.width, TVcanvas.height);
  CamVCTX.clearRect(0, 0, CamVCanvas.width, CamVCanvas.height);
  SVCTX.clearRect(0, 0, SVcanvas.width, SVcanvas.height);

  renderTV();
  renderCamV();
  renderSV();

}

function rotateCamDown(amount){

  camROVert = camROVert + amount;

  //updateCamHatsVert();

  //updateCamHatsMulti();

  updateCamHatsSequential();

  updateCamViewScope();

  calculateCamScreenDV();

  TVCTX.clearRect(0, 0, TVcanvas.width, TVcanvas.height);
  CamVCTX.clearRect(0, 0, CamVCanvas.width, CamVCanvas.height);
  SVCTX.clearRect(0, 0, SVcanvas.width, SVcanvas.height);

  renderTV();
  renderCamV();
  renderSV();


 // console.log("EGG: I^[x]: " + camIHat[0] + " I^[y]: " + camIHat[1] + " I^[z]: " + camIHat[2]);
 // console.log("EGG: J^[x]: " + camJHat[0] + " J^[y]: " + camJHat[1] + " J^[z]: " + camJHat[2]);
 // console.log("EGG: K^[x]: " + camKHat[0] + " K^[y]: " + camKHat[1] + " K^[z]: " + camKHat[2]);

}


function moveCamForward(amount){

  updateCamCoordsMoveFoward(amount);



 // calculateCamHatsMag();

  //Note: updating camHats is probably pointless because the CamRO is not changing. But nonetheless I am doing it just in case
  //updateCamHats();

  updateCamViewScope();



  calculateCamScreenDV();

  TVCTX.clearRect(0, 0, TVcanvas.width, TVcanvas.height);
  CamVCTX.clearRect(0, 0, CamVCanvas.width, CamVCanvas.height);

  renderTV();
  renderCamV();

  //inner function. Will update the cam coords based on RO
  function updateCamCoordsMoveFoward(amount){

    //calculating Z-axis disp of camera (which is the Y-axis on TV)
    //cos(camRO) = adj / amount. adj = cos(camRO)*amount. adj is the z-axis disp
    let zDisp = Math.cos(camRO) * amount;

    //calculating X-axis disp of camera
    //sin(camRO) = opp / amount. opp = sin(camRO) * amount.
    let xDisp = -(Math.sin(camRO) * amount);


    //caldulating Y-axis disp of camera TO DO Watermelon : feature in y-axis disps once you implement vertical RO




    //now updating the cam coords
    //z coord
    camCoords[2] = camCoords[2] + zDisp;

    //x coord
    camCoords[0] = camCoords[0] + xDisp;





  }


}


function moveCamBackwards(amount){

  updateCamCoordsMoveBackwards(amount);

 // calculateCamHatsMag();

  //Note: updating camHats is probably pointless because the CamRO is not changing. But nonetheless I am doing it just in case
  updateCamHats();

  updateCamViewScope();

  calculateCamScreenDV();

  TVCTX.clearRect(0, 0, TVcanvas.width, TVcanvas.height);
  CamVCTX.clearRect(0, 0, CamVCanvas.width, CamVCanvas.height);

  renderTV();
  renderCamV();

  //inner function. Will update the cam coords based on RO
  function updateCamCoordsMoveBackwards(amount){

    //calculating Z-axis disp of camera (which is the Y-axis on TV)
    //cos(camRO) = adj / amount. adj = cos(camRO)*amount. adj is the z-axis disp
    let zDisp = Math.cos(camRO) * amount;

    //calculating X-axis disp of camera
    //sin(camRO) = opp / amount. opp = sin(camRO) * amount.
    let xDisp = Math.sin(camRO) * amount;


    //caldulating Y-axis disp of camera TO DO Watermelon : feature in y-axis disps once you implement vertical RO




    //now updating the cam coords
    //z coord
    camCoords[2] = camCoords[2] - zDisp;

    //x coord
    camCoords[0] = camCoords[0] - xDisp;





  }


}




//END OF ACTION FUNCTIONS


//START OF SYSTEM FUNCTIONS (COORD AND VARIABLE UPDATING)

//Function used in experiment 21J-1 . Temporarily commented out.
/**
function calculateCamHatsMag(){

  let camDistSquared = Math.pow(camCoords[0],2) + Math.pow(camCoords[2],2);
  let camDist = Math.sqrt(camDistSquared);

  //CamHatsMag has an inverse relationship with DistToOrigin
  camHatsMag = 1/camDist;

}
*/


//will use the sequential method of updating the camHats
function updateCamHatsSequential(){

  //first update IHat
  camIHat[0] = Math.cos(camRO);
  camIHat[2] = -(Math.sin(camRO));


  //now update JHat
  let JHatYellow = Math.cos(camROVert);

  camJHat[1] = Math.cos(camROVert);

  let JHatRed = Math.sin(camROVert);

  camJHat[0] = Math.sin(camRO) * JHatRed;

  camJHat[2] = Math.cos(camRO) * JHatRed;


  //updating KHat
  //first orienting with HRO
  let KHatXDisp = Math.sin(camRO);
  let KHatZDisp = Math.cos(camRO);

  //this is the final X landing spot
  let KHatXDisp_XDisp = Math.cos(camROVert) * KHatXDisp;

  let KHatRed = KHatXDisp_XDisp / Math.sin(camRO);

  //this is the final y landing spot
  let KHatYDisp = Math.tan(camROVert) * KHatRed;

  //this is the final z landing spot
  let KHatZDisp_ZDisp = Math.cos(camROVert) * KHatZDisp;




  camKHat[0] = KHatXDisp_XDisp;
  camKHat[1] = -Math.sin(camROVert);
  camKHat[2] = KHatZDisp_ZDisp;


 // console.log("APPLE FUCK");



  console.log("caam-I^[0]: " + camIHat[0] + " ,  caam-I^[1]: " + camIHat[1] + " ; caam-I^[2]: " +  camIHat[2]);
  console.log("caam-J^[0]: " + camJHat[0] + " ,  caam-J^[1]: " + camJHat[1] + " ; caam-J^[2]: " +  camJHat[2]);
  console.log("caam-K^[0]: " + camKHat[0] + " ,  caam-K^[1]: " + camKHat[1] + " ; caam-K^[2]: " +  camKHat[2]);




}



//will use the 2 channel method of updating camHats
function updateCamHatsMulti(){

  //Horz channel
  camIHat[0] = Math.cos(camRO);
  camIHat[2] = -(Math.sin(camRO));

  camKHat[0] = Math.sin(camRO);
  camKHat[2] = Math.cos(camRO);


  //Vert channel
  //J^ channel 1 (vert)
  camJHat[1] = Math.cos(camROVert);




  camJHat[2] = (Math.sin(camROVert));

  //might need to factor in HRO for jhat
  //experimental (cross section of angles idea used)
  camJHat[0] = Math.sin(camRO*camROVert);


  //this is based on the inner nested displacement of the existing yDisp
 // camJHat[1] = Math.cos(camRO)*camJHat[1];





  //exerimentap


  //I think K^ is taken care of for now. focus on the other hats
  camKHat[0] = -(Math.cos(camROVert)) * camKHat[0];
  camKHat[1] = Math.sin(camROVert);
 // camKHat[1] = -(Math.sin(camROVert)) * camKHat[1];
  camKHat[2] = Math.cos(camROVert) * camKHat[2];





}



function updateHybridMatrixHorzRot(){

  //updating I^
 // camIHat[0] = (Math.cos(camRO));
 // camIHat[2] = -(Math.sin(camRO));

  hybridMatrix[0][0] = hybridMatrix[0][0] * (Math.cos(camRO));
  hybridMatrix[0][2] = hybridMatrix[0][2] * (-(Math.sin(camRO)));


  //updating K^
 // camKHat[0] = (Math.sin(camRO));
 // camKHat[2] = (Math.cos(camRO));

  hybridMatrix[2][0] = hybridMatrix[2][0] * (Math.sin(camRO));
  hybridMatrix[2][2] = hybridMatrix[2][2] * (Math.cos(camRO));


}




//will update the camHats. Must be called every time the camera rotates
//will use the hybrid Matrix to update the camHats
function updateCamHatsHorz(){

  //updating I^

  camIHat[0] = (Math.cos(camRO));

  //TO DO Watermelon : The y value for this will be updated with looking up and down.
  //note: the equation below might be wrong. You should use sin not cos
  // camIHat[1] = (Math.cos(camROVert));

  //NEWCODE FACTOR IN VERT ROT
  //camIHat[1] = (Math.sin(camROVert));
  //NEWCODE FACTOR IN VERT ROT

  camIHat[2] = -(Math.sin(camRO));

  //Added after 22nd June
  //To Do Watermelon : update J^ when implementing vertical cam rotation
  //To Do Watermelon : you need to update the camJHat[0]. The component vectors are a little tricky to figure out, use maya.
  //To Do watermelon: camJHat[0] is probably sin(camRO). Just try it and see
  //JOHNNY BRAVO
  //camJHat[0] = -(Math.sin(camROVert));
  // camJHat[0] = (Math.sin(camRO));
 // camJHat[1] = (Math.cos(camROVert));
  //camJHat[2] = (Math.sin(camROVert));

  //NEWCODE FACTOR IN VERT ROT
  //DEALING WITH CAMJHAT
/**
  let theta1 = (Math.PI/2) - camROVert;
  let theta2 = -((Math.PI/2) - camRO);

  let yDisp = Math.sin(theta1);
  let hyp1 = Math.cos(theta1);

  let zDisp = Math.sin(theta2) * hyp1;
  let xDisp = Math.cos(theta2) * hyp1;

  camJHat[0] = xDisp;
  camJHat[1] = yDisp;
    camJHat[2] = zDisp;
*/
  //NEWCODE FACTOR IN VERT ROT


  /**
   //EXPERIMENTAL
   //camJHat[0] = (Math.sin(camRO));
   camJHat[1] = (Math.sin(camROVert));
   camJHat[2] = (Math.cos(camROVert));


   // camJHat[0] = (Math.cos(camROVert));
   camJHat[1] = (Math.sin(camROVert));
   camJHat[2] = (Math.cos(camROVert));

   //EXPERMENTAL
   */

  //updating K^
  camKHat[0] = (Math.sin(camRO));
  //TO DO Watermelon : The y value for this will be updated with looking up and down.

 // camKHat[1] = (Math.sin(camROVert));

  //NEWCODE VERT ROT
  

  //NEWCODE VERT ROT

  camKHat[2] = (Math.cos(camRO)) * Math.cos(camROVert);








}



function updateCamHatsVert(){

  //updating J^
  camJHat[1] = Math.cos(camROVert);
  camJHat[2] = Math.sin(camROVert);

  //updating K^
  camKHat[1] = -(Math.sin(camROVert)) * (Math.cos(camRO));

  //this line below is kind of experimental. It is based on the idea of matrix multiiplication because it is the only square in the matrix that is modified by vertical AND horizontal cam rotations.
  //camKHat[2] = Math.cos(camROVert) * (Math.cos(camRO)) * -(Math.sin(camRO));
  //camKHat[2] = Math.cos( camROVert * Math.cos(camRO));
  camKHat[2] = Math.cos(camROVert) * (Math.cos(camRO));

  //console.log("Cos(VRO):"+(Math.cos(camROVert)) + " * Cos(HRO):" + (Math.cos(camRO)));








}


//will define the dimensions of the camViewScope based on the current camCoords
function updateCamViewScope(){

  //first defining the camViewScopeNormals Point





}


function updateCamYPlaneToOriginAngle(){

  let extraAngle = Math.atan(camCoords[1]/camCoords[2]);

  camYPlaneToOriginAngle = (Math.PI / 2) + extraAngle;


}



//will update the CamXPlaneToOriginAngle variable
function updateCamXPlaneToOriginAngle(){

  //Steps: 90 degrees is the original basis for what you're basing of camRO of 0 on. So you need to
  //find the extra angle that is made when finding the cam distance to origin. Add this exra angle to 90.
  //if the origin is to the right of the cam, this value will be positive. If its to the left, it will be negative. Because if its ont he right, this basis angle is obtuse. If its to the left, it will be acute.

  //how to get this extra angle T.
  //Tan T = xDisplacementOfCam / zDisplacementOfCam.
  //use tan inverse

  let extraAngle = Math.atan(camCoords[0]/camCoords[2]);



  //now we have to add 90 degrees to it.
  camXPlaneToOriginAngle = (Math.PI / 2) + extraAngle;






}


//END OF SYSTEM FUNCTIONS (COORD AND VARIABLE UPDATING)



//START OF MAINTENENCE FUNCTIONS

//will calculate the distance between the camera's center and the world origin.
function calcDistToOrigin(){

  //we need to find the component vectors of the x,y and z axis.
  let camDistSquared = Math.pow(camCoords[0],2) + Math.pow(camCoords[1], 2) + Math.pow(camCoords[2],2);
  let camDist = Math.sqrt(camDistSquared);

  return camDist;
}


//Will update the camScreenDV by using the camRO and cam coords
//Investigative note: Make sure the final polarity of the value is accurate. If the vector has to land to the left of the camera, it has to be negative. If it has to land right, it has to be positive.
function calculateCamScreenDV(){

  //first calculating the distance from cam to origin
  //use pythagorean theorem
 //let camDistSquared = Math.pow(camCoords[0],2) + Math.pow(camCoords[2],2);
 let camDist = calcDistToOrigin();


  updateCamXPlaneToOriginAngle();

  updateCamYPlaneToOriginAngle();

  //blueberry: add an alternative updateCamXPlaneToOriginAngle



 camScreenDV[0] = -(Math.cos(camXPlaneToOriginAngle - camRO) * camDist);

  //not sure if this is the correct calculation
  //camScreenDV[1] = (Math.cos(camXPlaneToOriginAngle - camROVert) * camDist);

  //Floating code for now.
  //camScreenDV[1] = (Math.tan(camROVert) * camDist);

  //organically calculating the y-axis of the camScreenDV
  //tanX = yDispofCam / zDispOfCam
 // let angleX = Math.atan(camCoords[1]/camCoords[2]);

 // let camYPlaneToOriginAngle = (Math.PI/2) + angleX;
 // let angleB = camYPlaneToOriginAngle - camROVert;

  //cos(angleB) = adj / camdist
 // camScreenDV[1] = Math.cos(angleB) * camDist;
  camScreenDV[1] = (Math.cos(camYPlaneToOriginAngle - camROVert) * camDist);










 //now we have to decide if we should reverse the polarity depending on which side of the x-axis the cam is on.

  if(camCoords[2] < 0){
    camScreenDV[0] = camScreenDV[0] * 1;
  }


  /**
  if(camCoords[1] < 0){
    camScreenDV[1] = camScreenDV[1] * -1;
  }
   */


  //EXPERIMENTAL PHASE: Adjusting magnitude of CamScreenDV
  //This code segment has been marked as DANGER CODE. Which means that it could possibly cause a lot of problems so you should always consider it when debugging
  //DANGER CODE DINOSAUR
  //camScreenDV[0] = camScreenDV[0]*2;



 //TO DO Watermelon : You need to calculate the y coordinate of the DV. camScreenDV[1];

  //console.log("CamScreenDV: " + camScreenDV[0]);


}

//will draw a big Circle in the formal coords specified and on the canvas specified and the color specified.
function drawCircle(canvas, ctx, X, Y, color){


  let coords = getCanvasCoordsOfActualCoordsImproved(canvas, X, Y);

  ctx.beginPath();
  ctx.strokeStyle = color;

  ctx.arc(coords[0], coords[1], 10, 0, 2*Math.PI);
  ctx.stroke();





}



//Will take in an source point (of the ray), an angle (in radians), a length, and color. It will shoot a ray from the source point at the specified angle, and it will shoot it for that length. The ray will be the specified color
//note: might not be a good idea to organically draw a ray with each increment because it will be processor intensive
function shootRay(canvas, ctx, srcX, srcY, angle, length, color){

  let xDisp = length * Math.sin(angle);
  let yDisp = length * Math.cos(angle);

  let xDest = srcX + xDisp;
  let yDest = srcY + yDisp;

  drawLineFCImproved(canvas, ctx, srcX, srcY, xDest, yDest, color);
}


function shootRaySourceTowardsTarget(canvas, ctx, srcX, srcY, trgX, trgY, length, color){

  let xDiff, yDiff;
  /**
  if(trgX > srcX){
    xDiff = trgX - srcX;
  }

  else if(trgX <= srcX){
    xDiff = srcX - trgX;
  }

  if(trgY < srcY){
    yDiff = trgY - srcY;
  }

  else if(trgY >= srcY){
    yDiff = srcY - trgY;
  }
   */

   xDiff = trgX - srcX;
   yDiff = trgY - srcY;
 // console.log("-----------------------------------------");

 // console.log("xDiff: " + xDiff + " ; yDiff: " + yDiff);

  //tan(x) = yDiff / xDiff

  /**
  let trajectoryAngle = Math.atan(yDiff/xDiff);
  */

  //starting it off with a 90 degree offset
  let trajectoryAngle = Math.PI/2;



  //factoring in the natural angle to this offset
    trajectoryAngle = trajectoryAngle - (Math.atan(xDiff/yDiff));


    //inverting by 180 degrees
    trajectoryAngle = trajectoryAngle + (Math.PI);

//  trajectoryAngle = trajectoryAngle + (Math.PI/2);

  /**
  if(trajectoryAngle>=0){

    trajectoryAngle = trajectoryAngle + (Math.PI);

  }
   */





  let angleInDeg =  (180/Math.PI) * trajectoryAngle;

  //console.log("trajectoryAngle(Deg): " + angleInDeg);


  //sin(trajectoryAngle) = yDisp / length;

  let yDisp = Math.sin(trajectoryAngle) * length;

  let xDisp = Math.cos(trajectoryAngle) * length;

 // console.log("xDisp: " + xDisp + " ; yDisp: " + yDisp);


  /**
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.moveTo(srcX, srcY);
  ctx.lineTo(srcX+xDisp, srcY+yDisp);
  ctx.stroke;
  */

  drawLineFCImproved(TVcanvas, TVCTX, srcX, srcY, (srcX+xDisp), (srcY+yDisp), color);

 // console.log("func running");

}




//FC stands for formal coordinates. This function will take in the canvas name, the formal grid coordinates of the origin and destination of a line and the color and then draw it. It will handle canvas coordinate conversion on its own
function drawLineFC(canvas, orgX, orgY, destX, destY, color){

  let canvasOrgPoints = getCanvasCoordsOfActualCoords(orgX, orgY);
  let canvasDestPoints = getCanvasCoordsOfActualCoords(destX, destY);

  canvas.beginPath();
  canvas.strokeStyle = color;
  canvas.moveTo(canvasOrgPoints[0], canvasOrgPoints[1]);
  canvas.lineTo(canvasDestPoints[0], canvasDestPoints[1]);
  canvas.stroke();

}


function drawLineFCImproved(canvas, ctx, orgX, orgY, destX, destY, color){

  let canvasOrgPoints = getCanvasCoordsOfActualCoordsImproved(canvas, orgX, orgY);
  let canvasDestPoints = getCanvasCoordsOfActualCoordsImproved(canvas, destX, destY);

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.moveTo(canvasOrgPoints[0], canvasOrgPoints[1]);
  ctx.lineTo(canvasDestPoints[0], canvasDestPoints[1]);
  ctx.stroke();

}



function drawLineFCImprovedDashed(canvas, ctx, orgX, orgY, destX, destY, color){

  ctx.setLineDash([4, 7]);
  drawLineFC(ctx, orgX, orgY, destX, destY, color);
  ctx.setLineDash([]);

}

function fillTextFC(canvas, orgX, orgY, color, text){

  let canvasCoords = getCanvasCoordsOfActualCoords(orgX, orgY);

  canvas.fillStyle = color;
  canvas.font = '12px Arial';
  canvas.fillText(text, canvasCoords[0], canvasCoords[1]);


}


function getCanvasCoordsOfActualCoordsImproved(canvas, formalXCoord, formalYCoord){

  var minXCoord = -(gridColumns/2);
  var maxXCoord = (gridColumns/2);

  var minYCoord = -(gridRows/2);
  var maxYCoord = (gridRows/2);

  //these are the coordinates according to the positive negative orientation
  var xCanvasCoord = Math.abs(minXCoord) + formalXCoord;
  var yCanvasCoord = Math.abs(minYCoord) - formalYCoord;

  var columnUnitLength = canvas.width / gridColumns;
  var rowUnitLength = canvas.height / gridRows;

  //now we have to scale it to the actual size of the canvas
  //scaling by size of one grid square
  xCanvasCoord = xCanvasCoord * columnUnitLength;
  yCanvasCoord = yCanvasCoord * rowUnitLength;


  //now we have to flip it because HTML canvas is the other way around

  var convertedCoords = [xCanvasCoord, yCanvasCoord];

  return convertedCoords;



}


function getCanvasCoordsOfActualCoords(formalXCoord, formalYCoord){

  var minXCoord = -(gridColumns/2);
  var maxXCoord = (gridColumns/2);

  var minYCoord = -(gridRows/2);
  var maxYCoord = (gridRows/2);


  //these are the coordinates according to the positive negative orientation
  var xCanvasCoord = Math.abs(minXCoord) + formalXCoord;
  var yCanvasCoord = Math.abs(minYCoord) - formalYCoord;

  var columnUnitLength = TVcanvas.width / gridColumns;
  var rowUnitLength = TVcanvas.height / gridRows;


  //now we have to scale it to the actual size of the canvas
  //scaling by size of one grid square
  xCanvasCoord = xCanvasCoord * columnUnitLength;
  yCanvasCoord = yCanvasCoord * rowUnitLength;


  //now we have to flip it because HTML canvas is the other way around

  var convertedCoords = [xCanvasCoord, yCanvasCoord];

  return convertedCoords;
}


//Will display all the readings of all the components in the div
function displayText(){

 // document.getElementById("CSPH3 h3").innerText = "WHAT";

  let camRORounded = Math.round(camRO*100)/100;
  document.querySelector("#CamROReadingOutput").innerText = camRORounded;

  let camROVertRounded = Math.round(camROVert*100)/100;
  document.querySelector("#CamROVertReadingOutput").innerText = camROVertRounded;

  let cosCamROVert = Math.cos(camROVert);
  let cosCamROVertRounded = Math.round(cosCamROVert*100)/100;
  document.querySelector("#CosCamROVertReadingOutput").innerText = cosCamROVertRounded;

  //dealing with camHats output

  let camHatsLengths = camHatLengthOutputter();

  let camIHatXRounded = Math.round(camIHat[0] * 100)/100;
  let camIHatYRounded = Math.round(camIHat[1]* 100)/100;
  let camIHatZRounded = Math.round(camIHat[2]*100)/100;
  document.querySelector("#CamIHatOutput").innerText = (camIHatXRounded + ", " + camIHatYRounded + ", " + camIHatZRounded);

  let camJHatXRounded = Math.round(camJHat[0] * 100)/100;
  let camJHatYRounded = Math.round(camJHat[1]* 100)/100;
  let camJHatZRounded = Math.round(camJHat[2]*100)/100;
  document.querySelector("#CamJHatOutput").innerText = (camJHatXRounded + ", " + camJHatYRounded + ", " + camJHatZRounded);


  let camKHatXRounded = Math.round(camKHat[0] * 100)/100;
  let camKHatYRounded = Math.round(camKHat[1]* 100)/100;
  let camKHatZRounded = Math.round(camKHat[2]*100)/100;
  document.querySelector("#CamKHatOutput").innerText = (camKHatXRounded + ", " + camKHatYRounded + ", " + camKHatZRounded);

  //dealing with worldHats output
  let worldIHatXRounded = Math.round(worldIHat[0] * 100)/100;
  let worldIHatYRounded = Math.round(worldIHat[1]* 100)/100;
  let worldIHatZRounded = Math.round(worldIHat[2]*100)/100;
  document.querySelector("#WorldIHatOutput").innerText = (worldIHatXRounded + ", " + worldIHatYRounded + ", " + worldIHatZRounded);

  let worldJHatXRounded = Math.round(worldJHat[0] * 100)/100;
  let worldJHatYRounded = Math.round(worldJHat[1]* 100)/100;
  let worldJHatZRounded = Math.round(worldJHat[2]*100)/100;
  document.querySelector("#WorldJHatOutput").innerText = (worldJHatXRounded + ", " + worldJHatYRounded + ", " + worldJHatZRounded);


  let worldKHatXRounded = Math.round(worldKhat[0] * 100)/100;
  let worldKHatYRounded = Math.round(worldKhat[1]* 100)/100;
  let worldKHatZRounded = Math.round(worldKhat[2]*100)/100;
  document.querySelector("#WorldKHatOutput").innerText = (worldKHatXRounded + ", " + worldKHatYRounded + ", " + worldKHatZRounded);


  //dealing with camScreenDV
  let camScreenDVX = Math.round(camScreenDV[0]*100)/100;
  let camScreenDVY = Math.round(camScreenDV[1]*100)/100;
  document.querySelector("#CamScreenDVOutput").innerText = (camScreenDVX + ", " + camScreenDVY);


  //dealing with camCoords
  document.querySelector("#CamCoordsOutput").innerText = (camCoords[0] + ", " + camCoords[1] + ", " + camCoords[2]);

  //dealing with camHats Lengths

  //inner function will return 3 value array for the length of CamI^, CamJ^ and CamK^ in that order
  function camHatLengthOutputter(){

    let lengths = [];

    //dealing with CamI^. Remember that you need to feature in displacements on ALL axis. Not just a 2D plane.
    //Using Pythgorean theorem for all axis
     let camIHatLengthSquared = Math.pow(camIHat[0], 2) + Math.pow(camIHat[1], 2) + Math.pow(camIHat[2], 2);
     let camIHatLength = Math.sqrt(camIHatLengthSquared);

    let camJHatLengthSquared = Math.pow(camJHat[0], 2) + Math.pow(camJHat[1], 2) + Math.pow(camJHat[2], 2);
    let camJHatLength = Math.sqrt(camJHatLengthSquared);

    let camKHatLengthSquared = Math.pow(camKHat[0], 2) + Math.pow(camKHat[1], 2) + Math.pow(camKHat[2], 2);
    let camKHatLength = Math.sqrt(camKHatLengthSquared);

    lengths[0] = camIHatLength;
    lengths[1] = camJHatLength;
    lengths[2] = camKHatLength;

    return lengths;
  }


}


function displayWarningPanelText(){

  let contentArea = document.querySelector("#warningsPanel section");

  if(sceneInitializedCheckSwitch==true){
    contentArea.innerText = "Scene Initialized";
  }

  if(joystickActiveSwitch==true){
    contentArea.innerText = "Joystick active";
  }


}


//needs to be called in the intializeScene and activate joystick function. It will update the display based on this.
function updateWarningsPanel(){

  let target = document.querySelector("#warningsPanel section div");

  let message1 = "";
  let message2 = "";

  let message1Color = "Green";
  let message2Color = "Green";

  if(sceneInitializedCheckSwitch==true){
    message1 = "Scene Initialized";
  }
  else if(sceneInitializedCheckSwitch==false){
    message1 = "Scene not initialized (Press 'Initialize Scene' button)";
    message1Color = "Red";
  }


  if(joystickActiveSwitch==true){
    message2 = "Joystick activated";
  }

  else if(joystickActiveSwitch==false){
    message2 = "Joystick not activated (Press 'Activate Joystick' button)";
    message2Color = "Red";
  }


  target.style.color = message1Color;
  target.innerHTML = message1;

  target.innerHTML = target.innerHTML + "<br>";

  target.style.color = message2Color;
  target.innerHTML = target.innerHTML + message2;




}

//END OF MAINTENENCE FUNCTIONS
