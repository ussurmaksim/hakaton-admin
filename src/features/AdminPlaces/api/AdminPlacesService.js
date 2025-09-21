import {makeRequest} from "@/shared/api/makeRequest.js";

class AdminPlacesService {
    crPlaces (places) {
        return makeRequest({
                url: "/places/import",
                method: "POST",
                data: places,
            });
    }

    getPlaces () {}
}

export default new AdminPlacesService();