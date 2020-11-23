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

        camera.threeCamera = new THREE.OrthographicCamera(RPM.CANVAS_WIDTH / -4, RPM.CANVAS_WIDTH / 4,
            RPM.CANVAS_WIDTH / 6, RPM.CANVAS_WIDTH / -6, 1, 1000);
        camera.distance = this.distance;
        camera.horizontalAngle = 270;
        camera.verticalAngle = 0;
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

        camera.threeCamera.zoom = 2;
        camera.threeCamera.updateProjectionMatrix();
    
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

        cameras["Original"] = await this.UKL_GetNewCamera();
    }

    //The angle set by camera file.
    var originAngle = 0;
    //Elevation level of player before starting.
    var originY = 0;
    var originROT = 0; //Original angle for facing planes.

    var CamTransitioning = false; //Determines if the transitioning sequence is occuring. Also informs what is transitioning (2D or 3D?)
    var transitionFaceSprites = false;
    //Changes camera into orthographic 2D camera.
    SceneMap.prototype.TransitionTo2D =  function(){
        CamTransitioning = "2D"

        //Only when transition from 3D does it set these variables.
        if(RPM.currentMap.camera.threeCamera.fov){
            originY = RPM.game.hero.position.y; //Original Y position. Y position increases to account for ordering sprites in 2D.
            originROT = RPM.game.hero.mesh.rotation.x; //Original rotation. All face sprites are rotated.
        }
        transitionFaceSprites = false
        this.updateTransitionCameras(CamTransitioning); 
    }

    //Changes camera into perspective 3D camera.
    SceneMap.prototype.TransitionTo3D =  function(){
        
        originAngle = cameras["Original"].verticalAngle;
        CamTransitioning = "3D"
        transitionFaceSprites = false
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
                {

                    RPM.currentMap.camera = cameras["Perspective"];
                    this.TranCam2DTo3D();
                }

                else //If done transition turn off.
                    CamTransitioning = false;
            else{ // Now we transition from 3D to 2D.
                RPM.currentMap.camera = cameras["Perspective"];
                this.TranCam3DTo2D();
            }
        }else{
            if(Dim === "2D"){
                CamTransitioning = false;
            }
            else{
                this.TranCam2DTo3D();
                
            }
        }
    }

    SceneMap.prototype.TranCam3DTo2D = function(){

        let turningAngle = RPM.currentMap.camera.verticalAngle*-0.15;

        transitionCameraTo2D(this.camera, -1, RPM.currentMap.camera.verticalAngle);
        this.RotateAllFaceSprites(turningAngle, false);

        if( Math.abs(RPM.currentMap.camera.verticalAngle) < 5){
            turningAngle = -90;
            RPM.game.hero.position.y += 10;
            RPM.game.hero.move(0,0,0,0);    
            //When finished change camera.
            this.camera = cameras["Orthographic"];
            RPM.game.hero.updateRot2DCam(-90);
            
        }

    }

    SceneMap.prototype.TranCam2DTo3D = function(){

        transitionFaceSprites = true;
        let turningAngle = RPM.currentMap.camera.verticalAngle*-0.15;
        if( Math.abs(RPM.currentMap.camera.verticalAngle - originAngle) < 5){
            turningAngle = originROT;
            RPM.game.hero.position.y = originY;
            transitionFaceSprites = false;
            RPM.game.hero.move(0,0,0,0);
            

        }
        transitionCameraTo3D(this.camera, -1, RPM.currentMap.camera.verticalAngle);
        this.RotateAllFaceSprites(turningAngle, false);

        //Changes camera to perspective after transitioning is complete.
        if(!transitionFaceSprites)
            RPM.currentMap.camera = cameras["Original"];
        else
            RPM.currentMap.camera = cameras["Perspective"];
        
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
                    mapPortion.updateFaceSprites2D(turningAngle, false);
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

    //This will be replaced when the reset camera feature is officially implemented.
    SceneMap.prototype.UKL_GetNewCamera = async function(){

        this.mapProperties = new MapProperties();
        let json = await RPM.parseFileJSON(RPM.FILE_MAPS + this.mapName + RPM
            .FILE_MAP_INFOS);
        this.mapProperties.read(json);

        let cam = new Camera(this.mapProperties.cameraProperties, RPM
            .game.hero);

        return cam;
    }

})();