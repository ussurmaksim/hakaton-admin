import {makeAutoObservable, runInAction} from "mobx";
import UsersService from "@/features/AdminUsers/api/UsersService.js";

class AdminUsersStore {
    _users = [];
    _isLoading = false;

    _page = 0;
    _size = 10;
    _totalPages = 0;
    _totalElements = 0;

    constructor() {
        makeAutoObservable(this)
    }

    get users() {return this._users;}
    get isLoading() {return this._isLoading;}
    get page() {return this._page;}
    get size() {return this._size;}
    get totalPages() {return this._totalPages;}
    get totalElements() {return this._totalElements;}

    setPage(page) {this._page = page;}
    setSize(size) {this._size = size;}

    addUsers(users) {this._users = [ ...this._users, users];}


    getUsers = async(page = this._page, size = this._size) => {
        this._isLoading = true;

        const res = await UsersService.getUsers({page, size});
        const data = res.data

        if ('data' in res) {
            runInAction(()=> {
                this._users = data ?? [];
                this._page = data.page ?? page;
                this._size = data.page ?? size;
                this._totalPages = data.totalPages ?? 0;
                this._totalElements = data.totalElements ?? 0;
            })
        }

        this._isLoading = false;
    }



}

export default AdminUsersStore;