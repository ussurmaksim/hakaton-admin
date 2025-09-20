import { makeAutoObservable } from 'mobx';
import { AdminAuthStore } from '@/features/adminAuth/model/store.js';
import AdminUsersStore from "@/features/AdminUsers/model/store.js";
import {NewsStore} from "@/features/AdminNews/model/store.js";
import {NewsAdminStore} from "@/features/AdminNews/model/AdminStore.js";


class Store {
    adminAuth
    adminUsers
    news
    newsAdmin

    constructor() {
        this.adminAuth = new AdminAuthStore();
        this.adminUsers = new AdminUsersStore();
        this.news = new NewsStore();
        this.newsAdmin = new NewsAdminStore();

        makeAutoObservable(this);
    }
}

export default Store;
