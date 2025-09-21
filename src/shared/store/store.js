import { makeAutoObservable } from 'mobx';

import { SensorsStore } from '@/features/AdminSensors/model/store.js';

import { AdminAuthStore } from '@/features/adminAuth/model/store.js';
import AdminUsersStore from '@/features/AdminUsers/model/store.js';

import { NewsStore } from '@/features/AdminNews/model/store.js';
import { NewsAdminStore } from '@/features/AdminNews/model/AdminStore.js';
import { AdminPlacesStore } from '@/features/AdminPlaces/model/store.js';
import { NewsFeedStore } from '@/features/AdminNews/model/NewsFeedStore.js';
import { IncidentFeedStore } from '@/features/AdminNews/model/IncidentFeedStore.js';
import {CamerasStore} from "@/features/AdminCameras/model/store.js";
import {AIDigestStore} from "@/features/AIDigest/model/store.js";

export class Store {
    socket = null;

    constructor() {
        makeAutoObservable(this);

        this.adminAuth = new AdminAuthStore(this);
        // @ts-ignore
        this.adminUsers = new AdminUsersStore(this);

        this.news = new NewsStore(this);
        this.newsAdmin = new NewsAdminStore(this);
        this.places = new AdminPlacesStore(this);

        this.newsStore = new NewsFeedStore(this);
        this.incidentStore = new IncidentFeedStore(this);

        this.sensors = new SensorsStore(this);

        this.cameras = new CamerasStore(this);
        this.aiDigest = new AIDigestStore(this);

    }

    setSocket(socketCtx) {
        this.socket = socketCtx;
        this.sensors.initWs?.();
    }
}

export const rootStore = new Store();
