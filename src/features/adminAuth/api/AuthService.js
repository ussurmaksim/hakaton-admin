import {makeRequest} from '@/shared/api/makeRequest.js'

class AuthService {
    login(user) {
        return makeRequest({
            url: 'admin/login',
            method: 'POST',
            data: user
        })
    }
}

export default new AuthService();