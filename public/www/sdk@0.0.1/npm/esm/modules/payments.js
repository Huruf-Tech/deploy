import { compile } from "path-to-regexp";
export const paymentsModule = (sdk) => {
    const type = {};
    const methods = {
        type,
        config(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "config");
                const method = "get";
                const toPath = compile("payments/api/config");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        summary(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "summary");
                const method = "get";
                const toPath = compile("payments/api/summary");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        statement(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "statement");
                const method = "get";
                const toPath = compile("payments/api/statement");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        addFunds(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "addFunds");
                const method = "post";
                const toPath = compile("payments/api/add-funds");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        topupStatus(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "topupStatus");
                const method = "get";
                const toPath = compile("payments/api/topups/:id");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        flaggedCharge(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "flaggedCharge");
                const method = "get";
                const toPath = compile("payments/api/flagged");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        cards(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "cards");
                const method = "get";
                const toPath = compile("payments/api/cards");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        setupCard(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "setupCard");
                const method = "post";
                const toPath = compile("payments/api/cards/setup");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        finishCard(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "finishCard");
                const method = "post";
                const toPath = compile("payments/api/cards/finish");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        setDefaultCard(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "setDefaultCard");
                const method = "post";
                const toPath = compile("payments/api/cards/:id/default");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        removeCard(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "removeCard");
                const method = "delete";
                const toPath = compile("payments/api/cards/:id");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        updateAccount(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "updateAccount");
                const method = "patch";
                const toPath = compile("payments/api/account");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
        webhook(data) {
            return sdk.resolveAxiosResponse(async () => {
                sdk.checkPermission("payments", "webhook");
                const method = "post";
                const toPath = compile("payments/api/webhook/:gateway");
                const requestPayload = {
                    method,
                    url: toPath(sdk.resolvePathParams(data?.params)),
                    params: data?.query,
                    data: data?.body,
                    signal: data?.signal,
                    ...(data?.axiosConfig
                        ? sdk.resolveAxiosConfig(data.axiosConfig)
                        : undefined),
                };
                sdk.log("Sending Request:", requestPayload);
                const res = await sdk._axios.request(requestPayload);
                return res;
            }, data);
        },
    };
    methods.config.__scope = "payments";
    methods.summary.__scope = "payments";
    methods.statement.__scope = "payments";
    methods.addFunds.__scope = "payments";
    methods.topupStatus.__scope = "payments";
    methods.flaggedCharge.__scope = "payments";
    methods.cards.__scope = "payments";
    methods.setupCard.__scope = "payments";
    methods.finishCard.__scope = "payments";
    methods.setDefaultCard.__scope = "payments";
    methods.removeCard.__scope = "payments";
    methods.updateAccount.__scope = "payments";
    methods.webhook.__scope = "payments";
    sdk["_moduleGroup"].set(methods, "Billing");
    return methods;
};
