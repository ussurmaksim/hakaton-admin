import {makeAutoObservable} from "mobx";

export class SensorsStore {
    _items = [
        {
            id: 1,
            title: "Sensor 1",
            description: "test description from test in the void if the forest to test this",
            status: "active",
            area: "RU-MOW"
        }
    ]
    _isLoading = false;
    constructor() {
        makeAutoObservable(this);
    }
    get items() {return this._items}
    get isLoading() {return this._isLoading;}
}