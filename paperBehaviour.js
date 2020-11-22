
/*
* Creator UKL
* 
* Creates a composition based way to handle plugins.
* If user does not wish to use this, it serves as a library of static functions for quick access to mapObjects.
*/

var UKL_PAPER_OBJECTS = []; //Note, pollutes global space.
class paperBehaviour{
    /** @class
    * @property {boolean} isEnabled Determines if this script will continue running.
    * @property {boolean} firstEnable Determines if start method is enactivated.
    * @property {MapObject} gameObject The mapObject that is referenced by this plugin.
    * @property {string} name The name of this event.
    * @property {Object} initializeBehaviour The name of this event.
    * @property {number} current_time current updated time. ms
    * @property {number} deltaTime Time between last call. ms
    */

    constructor(eventName, enabled = true){
        this.name = eventName;
        this.isEnabled = enabled;
        this.firstEnable = true;
        UKL_PAPER_OBJECTS.push(this);
    }

    //This will get the mapObject of which this script modifies.
    async begin(){
        this.gameObject = await paperBehaviour.getObjectFromName(this.name);
        if(this.gameObject){
        }
           
    }

    update(){}


    /**
    * @param {THREE.VECTOR3} transVector //Vector that will move this mapObject.
    * Note, this is used to move the graphical element brutely.
    */
    move(transVector){
        this.gameObject.position = transVector;
        this.gameObject.changeState(); //Will update the graphical state.
    }

    //Note, this function only works with objects visible on screen.
    //If multiple objects share name, the first name is object found with such name is returned.
    static async getObjectFromName(objectName){
        let objectID = RPM.game.hero.system.id; //Gets the hero's ID so that only camera view is considered.

        //Portions of the map based on the event's position.
        let globalPortion = SceneMap.getGlobalPortion(RPM.currentMap.allObjects[
            objectID]);
            
        let localPortion = RPM.currentMap.getLocalPortion(globalPortion);
        let mapPortion;
        
        let returningObj = null; //The object that is returned.
        if (RPM.currentMap.isInPortion(localPortion))
        {
    
            mapPortion = RPM.currentMap.getMapPortionByPortion(localPortion);
            let objects = mapPortion.objectsList;
            for (let i = 0; i < objects.length; i++)
            { 
                if (objects[i].system.name === objectName)
                {
                    returningObj = objects[i]; 
                    break;
                }
            }
        }
        return returningObj;
    }
    

}

//Updates the objects and sets deltaTime.
(function() {


    var startTime = new Date();
    //Will update the created object.
    var Alias_SceneMap_update = SceneMap.prototype.update;
    SceneMap.prototype.update = function(){
        
        Alias_SceneMap_update.call(this);

        //Updates and starts each paperBehaviour.
        UKL_PAPER_OBJECTS.forEach(function(obj){
            if(obj.firstEnable){
                obj.begin();
                obj.firstEnable = false;
            }
            else if(obj.isEnabled){
                let deltaTime = startTime - obj.current_time; //in ms
                obj.current_time = startTime;
                obj.deltaTime = deltaTime;
                obj.update();
            }

        })
        startTime = new Date();
    }

})();