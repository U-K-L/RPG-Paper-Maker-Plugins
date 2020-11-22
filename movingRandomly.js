/*
* Testing plugin for random movements.
*/

class movingRandomly extends paperBehaviour{

    /**
    @property {THREE.VECTOR3} originalPos
     */

    async begin(){

        await super.begin();
        this.originalPos = new THREE.Vector3( this.gameObject.position.x, this.gameObject.position.y, this.gameObject.position.z );
        
    }

    update(){
        this.spinInCircles();
    }

    spinInCircles(){
        let z = 10*Math.cos(this.current_time*0.01) + this.originalPos.z;
        let x = 10*Math.sin(this.current_time*0.01) + this.originalPos.x;
        let y = this.originalPos.y;

        const vec = new THREE.Vector3( x, y, z);

        this.move(vec);
    }
}