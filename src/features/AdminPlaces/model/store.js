import { makeAutoObservable } from "mobx";
import AdminPlacesService  from "@/features/AdminPlaces/api/AdminPlacesService.js";

export class AdminPlacesStore {
    _places = [];

    constructor() {
        makeAutoObservable(this);
    }

    get places() {
        return this._places;
    }

    setPlaces(list) {
        this._places = Array.isArray(list) ? list : [];
    }

    fetchPlaces = async () => {
        const res = await AdminPlacesService.fetchPlaces();
    }

    createPlaces = async (places) => {
        const res = await AdminPlacesService.crPlaces(places);
        if ('data' in res) {
            return res;
        }
    };
}
