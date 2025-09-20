import { makeAutoObservable } from 'mobx';
import { AdminAuthStore } from '@/features/adminAuth/model/store.js';
import AdminUsersStore from "@/features/AdminUsers/model/store.js";
import {NewsStore} from "@/features/AdminNews/model/store.js";
import {NewsAdminStore} from "@/features/AdminNews/model/AdminStore.js";
import {SensorsStore} from "@/features/AdminSensors/model/store.js";
import {AdminPlacesStore} from "@/features/AdminPlaces/model/store.js";
import {NewsFeedStore} from "@/features/AdminNews/model/NewsFeedStore.js";
import {IncidentFeedStore} from "@/features/AdminNews/model/IncidentFeedStore.js";


class Store {
    adminAuth
    adminUsers
    news
    newsAdmin
    sensors
    places
    newsStore
    incidentStore

    constructor() {
        this.adminAuth = new AdminAuthStore();
        this.adminUsers = new AdminUsersStore();
        this.news = new NewsStore();
        this.newsAdmin = new NewsAdminStore();
        this.sensors = new SensorsStore();
        this.places = new AdminPlacesStore();
        this.newsStore = new NewsFeedStore();          // ← сюда провайдер будет класть новости
        this.incidentStore = new IncidentFeedStore();  // ← сюда — инциденты

        makeAutoObservable(this);
    }
}

export default Store;
