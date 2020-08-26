import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { map, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  constructor(private db: AngularFireDatabase, private fs: AngularFirestore) { }

  getCells() {
    return this.db.list('/geo').valueChanges().pipe(
      first(),
      map((response) => {
        return response;
      }));
  }

  getStates() {
    this.fs.collection('states').snapshotChanges().subscribe((res) => {
      console.log(res);
    });
  }

  updateIds() {
    let features = this.db.list('/geo/features/features').valueChanges().subscribe(res => {
      let i = 0;
      for (let feature of res) {
          this.db.list('/geo/features/features/').update(i.toString(), { id : +feature['properties']['id'] });
          let prop = {
            state: feature['properties']['state'],
            neighbors: feature['properties']['neighbors'],
            biome: feature['properties']['biome'],
            population: feature['properties']['population'],
          };
          this.db.list('/geo/features/features/' + i).remove('properties');
          this.db.list('/geo/features/features/').update(i.toString(), { properties : prop });
          i++;
      }
    });
    //return this.db.list('/geo/features/features/' + id).update('properties', {state : '0'});
  }
}
