/*
* Creator UKL
* Turns RPM camera from 2.5D to 2D.
*/


(function() {

    var cameras = {};
    var Alias_InitializeCamera = SystemCameraProperties.prototype.initializeCamera;

    SystemCameraProperties.prototype.initializeCamera = function(camera)
    {
        if(this.fov == "2D")
            this.initializeOrthoCamera(camera);
        else
            Alias_InitializeCamera.call(this, camera);
    }

    SystemCameraProperties.prototype.initializeOrthoCamera = function(camera){

        camera.threeCamera = new THREE.OrthographicCamera(RPM.CANVAS_WIDTH / -6, RPM.CANVAS_WIDTH / 6,
            RPM.CANVAS_WIDTH / 12, RPM.CANVAS_WIDTH / -12, 1, 1000);
        camera.distance = this.distance;
        camera.horizontalAngle = this.horizontalAngle;
        camera.verticalAngle = this.verticalAngle*0;
        camera.verticalRight = true;
        camera.targetPosition = new THREE.Vector3();
        let x = this.targetOffsetX;
        if (this.isSquareTargetOffsetX)
        {
            x *= RPM.SQUARE_SIZE;
        }
        let y = this.targetOffsetY;
        if (this.isSquareTargetOffsetY)
        {
            y *= RPM.SQUARE_SIZE;
        }
        let z = this.targetOffsetZ;
        if (this.isSquareTargetOffsetZ)
        {
            z *= RPM.SQUARE_SIZE;
        }
        camera.targetOffset = new THREE.Vector3(x, y, z);
    }



    var Alias_readMapProperties = SceneMap.prototype.readMapProperties;
    SceneMap.prototype.readMapProperties =  async function(){
        await Alias_readMapProperties.call(this);
        

        cameras["Perspective"] = this.camera;

        let sysCam = new SystemCameraProperties(null);
        
        ///Sets these properties for orthographic camera.
        sysCam.distance = this.camera.distance;
        sysCam.horizontalAngle = this.camera.horizontalAngle;
        sysCam.verticalAngle = this.camera.verticalAngle;
        sysCam.targetOffsetX = 0
        sysCam.targetOffsetY = 0
        sysCam.targetOffsetZ = 0
        sysCam.isSquareTargetOffsetX = 0
        sysCam.isSquareTargetOffsetY = 0
        sysCam.isSquareTargetOffsetZ = 0
        sysCam.fov = "2D"
        sysCam.near = 0
        sysCam.far = 0



        cameras["Orthographic"] = new Camera(sysCam, RPM
            .game.hero);
    }

    var startTime = new Date();
    var perpAngle = 0;
    var originAngle = 0;
    var originDistance = 0;
    var originY = 0;
    var moving = true;

    var CamTransitioning = false; //Determines if the transitioning sequence is occuring. Also informs what is transitioning (2D or 3D?)
    var transitionFaceSprites = false;
    //Changes camera into orthographic 2D camera.
    SceneMap.prototype.TransitionTo2D =  function(){
        CamTransitioning = "2D"
        cameras["TransitionCamera"] = RPM.currentMap.camera.threeCamera.clone();
        console.log(cameras["TransitionCamera"].distance);
        this.updateTransitionCameras(CamTransitioning); 
    }

    //Changes camera into perspective 3D camera.
    SceneMap.prototype.TransitionTo3D =  function(){
        CamTransitioning = "3D"
        this.updateTransitionCameras(CamTransitioning); 
    }

    //Transitions to the opposite current camera...2D -> 3D, 3D -> 2D.
    SceneMap.prototype.TransitionToNextCam =  function(){
        
    }

    var Alias_update = SceneMap.prototype.update;
    SceneMap.prototype.update =  function(){  
        Alias_update.call(this);
        if(CamTransitioning)
            this.updateTransitionCameras(CamTransitioning);
    }

    //Controls the sequence and input of switching cameras from 2D to 3D.
    SceneMap.prototype.updateTransitionCameras =  function(Dim){

        //Ultimately, the difference between 2D and 3D is FOV. This checks if camera is done tranitioning and switches.
        if(this.camera.threeCamera.fov){
            //It is 3D
            if(Dim === "3D") //Are we transitioning to 3D while still in 3D?
                if(transitionFaceSprites) //When going to 3D, we need to turn perspective back on.
                    this.TranCame2DTo3D();
                else //If done transition turn off.
                    CamTransitioning = false;
            else{ // Now we transition from 3D to 2D.
                this.TranCame3DTo2D();
            }
        }else{
            if(Dim === "2D"){
                CamTransitioning = false;
            }
            else{
                this.TranCame2DTo3D();
            }
        }
    }

    SceneMap.prototype.TranCame3DTo2D = function(){

        let turningAngle = RPM.currentMap.camera.verticalAngle*-0.15;
        perpAngle = RPM.currentMap.camera.verticalAngle;

        if(originAngle < 1){
            originDistance = RPM.currentMap.camera.distance;
            originAngle = RPM.currentMap.camera.verticalAngle;
            originY = RPM.game.hero.position.y;
            moving = false;
        }

        transitionCameraTo2D(this.camera, -1, perpAngle);
        this.RotateAllFaceSprites(turningAngle, false);

        if( Math.abs(RPM.currentMap.camera.verticalAngle) < 5){
            turningAngle = -90;
            RPM.game.hero.position.y = 10;
            RPM.game.hero.move(0,0,0,0);    
            //When finished change camera.
            this.camera = cameras["Orthographic"];
            
        }

    }

    SceneMap.prototype.TranCame2DTo3D = function(){

        transitionFaceSprites = true;
        let turningAngle = RPM.currentMap.camera.verticalAngle*-0.15;
        perpAngle = RPM.currentMap.camera.verticalAngle;

        if(originAngle < 1){
            originDistance = RPM.currentMap.camera.distance;
            originAngle = RPM.currentMap.camera.verticalAngle;
            originY = RPM.game.hero.position.y;
            moving = false;
        }

 
        //Changes camera to perspective after transitioning is complete.
        this.camera = cameras["Perspective"];
        
        if( Math.abs(RPM.currentMap.camera.verticalAngle - originAngle) < 5){
            turningAngle = 270;
            RPM.game.hero.position.y = originY;
            transitionFaceSprites = false;
            RPM.game.hero.move(0,0,0,0);
            console.log(RPM.currentMap.camera.distance)
            RPM.currentMap.camera.threeCamera.distance = cameras["TransitionCamera"].distance;
            console.log(RPM.currentMap.camera.distance)
        }

        transitionCameraTo3D(this.camera, -1, perpAngle);
        this.RotateAllFaceSprites(turningAngle, false);

        
    }


    SceneMap.prototype.RotateAllFaceSprites = function(turningAngle){
        // Update face sprites
        if (!this.isBattleMap) 
        {
            // Update the objects
            RPM.game.hero.updateRot2DCam(turningAngle);
            this.updatePortions(this, function(x, y, z, i, j, k)
            {
                // Update face sprites
                let mapPortion = this.getMapPortion(i, j, k);
                if (mapPortion)
                {
                    mapPortion.updateFaceSprites2D(turningAngle, !moving);
                }
            });
        }
    }
    var transitionCameraTo2D = function(camera, timeLeft, originAngle){

        // Updating the time left
        let dif;
        if(timeLeft <= 0){
            timeLeft = 5000;
        }

        timeRate = 0.0625;
        let timeLeftRate = 6.2;
        dif = RPM.elapsedTime;
        timeLeft -= RPM.elapsedTime*timeLeftRate;

        if (timeLeft < 0) 
        {
            dif += timeLeft;
            timeLeft = 0;
        }

        RPM.currentMap.camera.updateTargetPosition();
        RPM.currentMap.camera.updateAngles();
        RPM.currentMap.camera.updateDistance();

        // Rotation


        RPM.currentMap.camera.horizontalAngle = 270;
        RPM.currentMap.camera.verticalAngle = ( (originAngle) )*( (timeLeft/5000) );
        // Zoom
        RPM.currentMap.camera.distance += (timeRate *  timeRate)*timeLeftRate*70;

        // Update
        RPM.currentMap.camera.update();
        

        return originAngle;
    }

    var transitionCameraTo3D = function(camera, timeLeft, originAngle){

        // Updating the time left
        let dif;
        if(timeLeft <= 0){
            timeLeft = 5000;
        }

        timeRate = 0.0625;
        let timeLeftRate = 6.2;
        dif = RPM.elapsedTime;
        timeLeft -= RPM.elapsedTime*timeLeftRate;

        if (timeLeft < 0) 
        {
            dif += timeLeft;
            timeLeft = 0;
        }

        RPM.currentMap.camera.updateTargetPosition();
        RPM.currentMap.camera.updateAngles();
        RPM.currentMap.camera.updateDistance();

        // Rotation


        RPM.currentMap.camera.horizontalAngle = 270;
        RPM.currentMap.camera.verticalAngle += 0.001*RPM.elapsedTime*( (originAngle) )*( (timeLeft/5000) );
        // Zoom
        RPM.currentMap.camera.distance -= (timeRate *  timeRate)*timeLeftRate*55;

        // Update
        RPM.currentMap.camera.update();



        return originAngle;
    }

    MapPortion.prototype.updateFaceSprites2D =  function(angle, updatePos = false){ //Is it 2D?
        let i, l;
        for (i = 0, l = this.faceSpritesList.length; i < l; i++)
        {
            this.faceSpritesList[i].rotation.x = angle;
            if(updatePos){
                if(angle === -90)
                this.faceSpritesList[i].position.y -= 2;
            else if(angle === 270)
                this.faceSpritesList[i].position.y += 2;
            }

        }
        for (i = 0, l = this.objectsList.length; i < l; i++)
        {

            this.objectsList[i].update(angle);
            this.objectsList[i].changeState();
            this.objectsList[i].move(0,0,0,0);


        }
    }

    MapObject.prototype.updateRot2DCam = function(angle){
        this.mesh.rotation.x = angle;
    }

})();