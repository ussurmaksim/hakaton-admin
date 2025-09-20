import { makeAutoObservable } from "mobx";
import AuthService from "@/features/adminAuth/api/AuthService.js";

export class AdminAuthStore {
    _account = {};
    _isLoading = false;

    constructor() {
        makeAutoObservable(this);
    }

    get account() {
        return this._account;
    }
    get isLoading() {
        return this._isLoading;
    }

    login = async (user) => {
        // this._isLoading = true;
        // try {
        //     const res = await AuthService.login(user);
        //
        //     if ("data" in res) {
        //         this._account = res.data;
        //         localStorage.setItem("accessToken", res.data.AccessToken);
        //     }
        // } finally {
        //     this._isLoading = false;
        // }
        this._account = {role: "Admin", email: user.email};
    };

    logout() {
        this._account = null;
    }
}
