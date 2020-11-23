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
            RPM.CANVAS_WIDTH / 8, RPM.CANVAS_WIDTH / -8, 1, 1000);
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

            
        this.camera = cameras["Orthographic"];
    }

    var startTime = new Date();
    var perpAngle = 0;
    var originAngle = 0;
    var originDistance = 0;
    var originY = 0;
    var moving = true;
    var Alias_update = SceneMap.prototype.update;
    SceneMap.prototype.update =  function(){
        let turningAngle = RPM.currentMap.camera.verticalAngle*-0.15;
        //Checks if this is the original angle.
        perpAngle = RPM.currentMap.camera.verticalAngle;
        if(originAngle < 1){
            originDistance = RPM.currentMap.camera.distance;
            originAngle = RPM.currentMap.camera.verticalAngle;
            originY = RPM.game.hero.position.y;
            moving = false;
        }


        Alias_update.call(this);

        //Changes perspective.
        if(Math.abs(startTime - new Date()) < 5500){
            turningAngle = 270;
            RPM.game.hero.position.y = originY;
            RPM.currentMap.camera.verticalAngle = originAngle;
            RPM.currentMap.camera.distance = originDistance;
            //Makes character land back to position.
            if(!moving){

                RPM.game.hero.move(0,0,0,0);
                
            }
            moving = true;
            this.camera = cameras["Perspective"];
            if(Math.abs(startTime - new Date()) > 5400){
                moving = false;
            }

            
            
        }
        else if(Math.abs(startTime - new Date()) < 12500){
            
            transitionCameraTo2D(this.camera, -1, perpAngle);
            if( Math.abs(RPM.currentMap.camera.verticalAngle) < 5){
                turningAngle = -90;
                RPM.game.hero.position.y = 10;

                //Makes character land back to position.
                if(!moving){
                    RPM.game.hero.move(0,0,0,0);
                }
                moving = true;
                this.camera = cameras["Orthographic"];
            }
                
        }else{
            this.camera = cameras["Perspective"];
            transitionCameraTo3D(this.camera, -1, perpAngle);
            moving = false;
            if( Math.abs(RPM.currentMap.camera.verticalAngle - originAngle) < 5)
                startTime = new Date();
        }

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