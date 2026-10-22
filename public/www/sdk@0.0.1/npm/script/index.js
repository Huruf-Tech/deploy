"use strict";
/**
 * Copyright © Huruf Tech 2026
 *
 * This is a generated file. Do not edit the contents of this file!
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThunderSDK = void 0;
const base_js_1 = require("./base.js");
const projectGroups_js_1 = require("./modules/projectGroups.js");
const projects_js_1 = require("./modules/projects.js");
const billing_js_1 = require("./modules/billing.js");
const billingAdmin_js_1 = require("./modules/billingAdmin.js");
const plans_js_1 = require("./modules/plans.js");
const gitIntegrations_js_1 = require("./modules/gitIntegrations.js");
const githubHooks_js_1 = require("./modules/githubHooks.js");
const templates_js_1 = require("./modules/templates.js");
const variables_js_1 = require("./modules/variables.js");
const home_js_1 = require("./modules/home.js");
const index_js_1 = require("./modules/index.js");
const agents_js_1 = require("./modules/agents.js");
const networks_js_1 = require("./modules/networks.js");
const registries_js_1 = require("./modules/registries.js");
const servers_js_1 = require("./modules/servers.js");
const storages_js_1 = require("./modules/storages.js");
const streams_js_1 = require("./modules/streams.js");
const alertEvents_js_1 = require("./modules/alertEvents.js");
const alertRules_js_1 = require("./modules/alertRules.js");
const _well_known_js_1 = require("./modules/.well-known.js");
const accessControl_js_1 = require("./modules/accessControl.js");
const accessControlPolicies_js_1 = require("./modules/accessControlPolicies.js");
const apiKeys_js_1 = require("./modules/apiKeys.js");
const auth_js_1 = require("./modules/auth.js");
const envs_js_1 = require("./modules/envs.js");
const imagekit_js_1 = require("./modules/imagekit.js");
const me_js_1 = require("./modules/me.js");
const oauth_js_1 = require("./modules/oauth.js");
const oauthClients_js_1 = require("./modules/oauthClients.js");
const tenantInvites_js_1 = require("./modules/tenantInvites.js");
const tenantMembers_js_1 = require("./modules/tenantMembers.js");
const tenantMemberships_js_1 = require("./modules/tenantMemberships.js");
const tenants_js_1 = require("./modules/tenants.js");
const users_js_1 = require("./modules/users.js");
const walletLedgers_js_1 = require("./modules/walletLedgers.js");
const wallets_js_1 = require("./modules/wallets.js");
const entry_js_1 = require("./plugins/essentials/entry.js");
class ThunderSDK extends base_js_1.BaseSDK {
    static getModuleNames() {
        return this._moduleNames;
    }
    static getModule(name) {
        if (!this.getModuleNames().includes(name)) {
            throw new Error(`Module not found: ${name}`);
        }
        return this[name];
    }
    static hasModule(name) {
        return this.getModuleNames().includes(name);
    }
    static getMetadata(module) {
        if (typeof module === "object") {
            return this._moduleMetadata.get(module);
        }
        return this._moduleMetadata.get(this.getModule(module));
    }
    static hasMetadata(module) {
        try {
            if (typeof module === "object") {
                return this._moduleMetadata.has(module);
            }
            return this._moduleMetadata.has(this.getModule(module));
        }
        catch {
            return false;
        }
    }
    static getGroup(module) {
        if (typeof module === "object") {
            return this._moduleGroup.get(module);
        }
        return this._moduleGroup.get(this.getModule(module));
    }
    static hasGroup(module) {
        try {
            if (typeof module === "object") {
                return this._moduleGroup.has(module);
            }
            if (!this.hasModule(module)) {
                return [...this._moduleGroup.values()].includes(module);
            }
            return this._moduleGroup.has(this.getModule(module));
        }
        catch {
            return false;
        }
    }
    static listActions(moduleName) {
        const actions = (() => {
            if (this._actionsList)
                return this._actionsList;
            const unpackModules = [];
            this.getModuleNames().forEach((name) => {
                Object.keys(this.getModule(name)).forEach((action) => {
                    unpackModules.push(`${name}.${action}`);
                });
            });
            return this._actionsList = unpackModules;
        })();
        if (moduleName) {
            return actions.filter((action) => action.startsWith(`${moduleName}.`));
        }
        return actions;
    }
}
exports.ThunderSDK = ThunderSDK;
_a = ThunderSDK;
Object.defineProperty(ThunderSDK, "_moduleNames", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: [
        "projectGroups",
        "projects",
        "billing",
        "billingAdmin",
        "plans",
        "gitIntegrations",
        "githubHooks",
        "templates",
        "variables",
        "home",
        "index",
        "agents",
        "networks",
        "registries",
        "servers",
        "storages",
        "streams",
        "alertEvents",
        "alertRules",
        "wellKnown",
        "accessControl",
        "accessControlPolicies",
        "apiKeys",
        "auth",
        "envs",
        "imageKit",
        "me",
        "oauth",
        "oauthClients",
        "tenantInvites",
        "tenantMembers",
        "tenantMemberships",
        "tenants",
        "users",
        "walletLedgers",
        "wallets",
    ]
});
Object.defineProperty(ThunderSDK, "projectGroups", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, projectGroups_js_1.projectGroupsModule)(_a)
});
Object.defineProperty(ThunderSDK, "projects", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, projects_js_1.projectsModule)(_a)
});
Object.defineProperty(ThunderSDK, "billing", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, billing_js_1.billingModule)(_a)
});
Object.defineProperty(ThunderSDK, "billingAdmin", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, billingAdmin_js_1.billingAdminModule)(_a)
});
Object.defineProperty(ThunderSDK, "plans", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, plans_js_1.plansModule)(_a)
});
Object.defineProperty(ThunderSDK, "gitIntegrations", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, gitIntegrations_js_1.gitIntegrationsModule)(_a)
});
Object.defineProperty(ThunderSDK, "githubHooks", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, githubHooks_js_1.githubHooksModule)(_a)
});
Object.defineProperty(ThunderSDK, "templates", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, templates_js_1.templatesModule)(_a)
});
Object.defineProperty(ThunderSDK, "variables", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, variables_js_1.variablesModule)(_a)
});
Object.defineProperty(ThunderSDK, "home", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, home_js_1.homeModule)(_a)
});
Object.defineProperty(ThunderSDK, "index", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, index_js_1.indexModule)(_a)
});
Object.defineProperty(ThunderSDK, "agents", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, agents_js_1.agentsModule)(_a)
});
Object.defineProperty(ThunderSDK, "networks", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, networks_js_1.networksModule)(_a)
});
Object.defineProperty(ThunderSDK, "registries", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, registries_js_1.registriesModule)(_a)
});
Object.defineProperty(ThunderSDK, "servers", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, servers_js_1.serversModule)(_a)
});
Object.defineProperty(ThunderSDK, "storages", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, storages_js_1.storagesModule)(_a)
});
Object.defineProperty(ThunderSDK, "streams", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, streams_js_1.streamsModule)(_a)
});
Object.defineProperty(ThunderSDK, "alertEvents", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, alertEvents_js_1.alertEventsModule)(_a)
});
Object.defineProperty(ThunderSDK, "alertRules", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, alertRules_js_1.alertRulesModule)(_a)
});
Object.defineProperty(ThunderSDK, "wellKnown", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, _well_known_js_1.wellKnownModule)(_a)
});
Object.defineProperty(ThunderSDK, "accessControl", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, accessControl_js_1.accessControlModule)(_a)
});
Object.defineProperty(ThunderSDK, "accessControlPolicies", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, accessControlPolicies_js_1.accessControlPoliciesModule)(_a)
});
Object.defineProperty(ThunderSDK, "apiKeys", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, apiKeys_js_1.apiKeysModule)(_a)
});
Object.defineProperty(ThunderSDK, "auth", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, auth_js_1.authModule)(_a)
});
Object.defineProperty(ThunderSDK, "envs", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, envs_js_1.envsModule)(_a)
});
Object.defineProperty(ThunderSDK, "imageKit", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, imagekit_js_1.imageKitModule)(_a)
});
Object.defineProperty(ThunderSDK, "me", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, me_js_1.meModule)(_a)
});
Object.defineProperty(ThunderSDK, "oauth", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, oauth_js_1.oauthModule)(_a)
});
Object.defineProperty(ThunderSDK, "oauthClients", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, oauthClients_js_1.oauthClientsModule)(_a)
});
Object.defineProperty(ThunderSDK, "tenantInvites", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, tenantInvites_js_1.tenantInvitesModule)(_a)
});
Object.defineProperty(ThunderSDK, "tenantMembers", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, tenantMembers_js_1.tenantMembersModule)(_a)
});
Object.defineProperty(ThunderSDK, "tenantMemberships", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, tenantMemberships_js_1.tenantMembershipsModule)(_a)
});
Object.defineProperty(ThunderSDK, "tenants", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, tenants_js_1.tenantsModule)(_a)
});
Object.defineProperty(ThunderSDK, "users", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, users_js_1.usersModule)(_a)
});
Object.defineProperty(ThunderSDK, "walletLedgers", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, walletLedgers_js_1.walletLedgersModule)(_a)
});
Object.defineProperty(ThunderSDK, "wallets", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: (0, wallets_js_1.walletsModule)(_a)
});
Object.defineProperty(ThunderSDK, "plugins", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        essentials: entry_js_1.essentialsEntry,
    }
});
