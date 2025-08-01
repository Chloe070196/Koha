export class CircRuleAPIClient {
    constructor(HttpClient) {
        this.httpClient = new HttpClient({
            baseURL: "/api/v1/circulation_rules",
        });
    }

    get circRules() {
        return {
            getAll: (query, params, headers) =>
                this.httpClient.getAll({
                    endpoint: "",
                    query,
                    params,
                    headers,
                }),
            update: rule =>
                this.httpClient.put({
                    endpoint: "",
                    body: rule,
                }),
            // TODO: WIP - DRAFT: test and amend accordingly
            // deletes a rule set as defined by the rule context (library_id, patron_category_id, item_id) and trigger number combination
            delete: (ruleSet, triggernumber) =>
                this.httpClient.delete({
                    endpoint: "",
                    body: {
                        rule_set: ruleSet,
                        triggernumber: triggernumber
                    },
                }),
            count: (query = {}) =>
                this.httpClient.count({
                    endpoint:
                        "?" +
                        new URLSearchParams({
                            _page: 1,
                            _per_page: 1,
                            ...(query && { q: JSON.stringify(query) }),
                        }),
                }),
        };
    }
}

export default CircRuleAPIClient;
