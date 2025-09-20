import {makeRequest} from "@/shared/api/makeRequest.js";

class UsersService {
    getUsers (params = {page: 0, size: 10}) {
        return makeRequest({
            url: '/users',
            method: 'GET',
            params,
        });
    }
}

export default new UsersService();